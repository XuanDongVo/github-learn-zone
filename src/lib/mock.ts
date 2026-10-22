import type { ExamQuestion, ExamAnswers } from "./exam";
import type { Activity, ActivitySession, ActivitySessionMode, AnswerFeedback, QuestionType, SelectionStrategy } from "./domain";

export type Unit = { id: number; code: string; name: string; description?: string };

export const UNITS: Unit[] = [
  { id: 1, code: "U1", name: "My Family", description: "Family members, possessives and simple present." },
  { id: 2, code: "U2", name: "Daily Routines", description: "Time expressions and adverbs of frequency." },
  { id: 3, code: "U3", name: "Food & Drink" },
];

const base = { gradeId: 6, gradeName: "Grade 6", status: "PUBLISHED" as const };
export const ACTIVITIES: Activity[] = [
  { ...base, id: 11, unitId: 1, unitCode: "U1", unitName: "My Family", name: "Family vocabulary", description: "Match family words to their meaning.", displayOrder: 1, totalQuestions: 5, mode: "BOTH", timeLimitSeconds: 20, lives: 3, availableSelectionStrategies: ["RANDOM", "WEAKNESS_PRIORITY"] },
  { ...base, id: 12, unitId: 1, unitCode: "U1", unitName: "My Family", name: "Possessive 's", description: "Practise using possessives correctly.", displayOrder: 2, totalQuestions: 5, mode: "LEARNING", availableSelectionStrategies: ["RANDOM"] },
  { ...base, id: 13, unitId: 1, unitCode: "U1", unitName: "My Family", name: "Speed check", displayOrder: 3, totalQuestions: 5, mode: "TRY_HARD", timeLimitSeconds: 15, lives: 2, availableSelectionStrategies: ["RANDOM"] },
  { ...base, id: 21, unitId: 2, unitCode: "U2", unitName: "Daily Routines", name: "What time is it?", description: "Telling the time in English.", displayOrder: 1, totalQuestions: 5, mode: "BOTH", timeLimitSeconds: 25, availableSelectionStrategies: ["RANDOM"] },
];

type Q = { type: QuestionType; content: string; options: { key: string; content: string }[]; answer: string[]; hint?: string; explanation: string };
const BANK: Q[] = [
  { type: "SINGLE_CHOICE", content: "Your mother's sister is your…", options: [{ key: "A", content: "Aunt" }, { key: "B", content: "Cousin" }, { key: "C", content: "Niece" }, { key: "D", content: "Uncle" }], answer: ["A"], hint: "She is a woman of your parents' generation.", explanation: "Your parent's sister is your aunt." },
  { type: "TRUE_FALSE", content: "Your father's father is your grandfather.", options: [{ key: "TRUE", content: "True" }, { key: "FALSE", content: "False" }], answer: ["TRUE"], explanation: "Grandfather = the father of a parent." },
  { type: "MULTIPLE_CHOICE", content: "Which of these are female family members?", options: [{ key: "A", content: "Sister" }, { key: "B", content: "Brother" }, { key: "C", content: "Daughter" }, { key: "D", content: "Nephew" }], answer: ["A", "C"], hint: "There are two correct answers.", explanation: "Sister and daughter are female." },
  { type: "FILL_IN_BLANK", content: "This is my brother ___ bike. (possessive)", options: [], answer: ["'s"], explanation: "We add 's to show possession: my brother's bike." },
  { type: "TYPE_ANSWER", content: "Type the word: the son of your brother or sister.", options: [], answer: ["nephew"], hint: "It starts with N.", explanation: "A nephew is your sibling's son." },
];

export function startSession(a: Activity, mode: ActivitySessionMode, selectionStrategy: SelectionStrategy): ActivitySession {
  return {
    id: Date.now(), status: "IN_PROGRESS", mode, selectionStrategy,
    totalQuestions: BANK.length, firstCorrectCount: 0, finalCorrectCount: 0, hintUsedCount: 0,
    ...(mode === "TRY_HARD" && a.lives !== undefined ? { lives: a.lives } : {}),
    questions: BANK.map((q, i) => ({ id: i + 1, position: i + 1, type: q.type, content: q.content, options: q.options, resolved: false, answerAttempts: 0, hintUsed: false, hasHint: mode === "LEARNING" && !!q.hint })),
  };
}
export const hintFor = (id: number) => BANK[id - 1]?.hint ?? "";

const norm = (s: string) => s.trim().toLowerCase().replace(/[’]/g, "'");
export function submitAnswer(s: ActivitySession, qid: number, answer: string[] | null): { session: ActivitySession; feedback: AnswerFeedback } {
  const src = BANK[qid - 1];
  if (!src) throw new Error("Question unavailable");
  const timedOut = answer === null;
  const correct = !timedOut && answer?.length === src.answer.length && src.answer.every((x) => answer?.some((y) => norm(y) === norm(x)));
  const questions = s.questions.map((q) => ({ ...q }));
  const q = questions[qid - 1];
  if (!q) throw new Error("Question unavailable");
  q.answerAttempts += 1;
  const maxAttempts = s.mode === "LEARNING" ? 2 : 1;
  const retryAvailable = !correct && q.answerAttempts < maxAttempts;
  if (q.answerAttempts === 1) q.firstCorrect = correct;
  if (!retryAvailable) { q.resolved = true; q.finalCorrect = correct; }
  let lives = s.lives;
  if (s.mode === "TRY_HARD" && !correct && !timedOut && lives != null) lives -= 1;
  const next: ActivitySession = {
    ...s, questions, ...(lives !== undefined ? { lives } : {}),
    firstCorrectCount: questions.filter((x) => x.firstCorrect).length,
    finalCorrectCount: questions.filter((x) => x.finalCorrect).length,
  };
  if (lives === 0) next.status = "GAME_OVER";
  else if (questions.every((x) => x.resolved)) next.status = "COMPLETED";
  if (next.status !== "IN_PROGRESS" && s.mode === "TRY_HARD") next.score = next.firstCorrectCount * 100;
  const revealed = !correct && !retryAvailable;
  return { session: next, feedback: { correct, retryAvailable, answerRevealed: revealed, ...(revealed ? { correctAnswer: src.answer.map((k) => src.options.find((o) => o.key === k)?.content ?? k).join(", ") } : {}), ...(correct || revealed ? { explanation: src.explanation } : {}) } };
}

export const delay = <T,>(v: T, ms = 450) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const EXAM_SAMPLE = {
  title: "Unit 3 · English assessment",
  course: "Grade 7 English",
  subtitle: "Grammar & vocabulary",
  remainingSeconds: 18 * 60 + 42,
  currentQuestion: 1,
  answers: {} as ExamAnswers,
};

// Presentation-only student summaries; never treated as live API records.
export const STUDENT_SAMPLE = { id: "sample-student", name: "Minh Anh", grade: 6, className: "6A", xp: 1240, nextLevelXp: 1300, streakDays: 7, classRank: 3, classSize: 28, dailyGoal: { target: 1, done: 0 } };
export const STUDENT_UNIT_PROGRESS = [65, 30, 0];
export const STUDENT_ASSIGNMENTS = [
  { id: 1, title: "Grammar & vocabulary", unitName: "Food & Drink", dueInDays: 2, questionCount: 20, timeLimitMinutes: 20, status: "TODO" as const },
  { id: 2, title: "My daily routine", unitName: "Daily Routines", dueInDays: 5, questionCount: 15, timeLimitMinutes: 20, status: "IN_PROGRESS" as const },
];
export const STUDENT_RANKING = [{ name: "Hoàng Nam", xp: 1480 }, { name: "Linh Chi", xp: 1360 }, { name: "Minh Anh", xp: 1240 }, { name: "Gia Huy", xp: 1180 }, { name: "Thảo My", xp: 1120 }];
export const STUDENT_RESULTS = [{ name: "Family vocabulary", mode: "Practice", score: "4/5", xp: 10, date: "Yesterday" }, { name: "Speed check", mode: "Try Hard", score: "3/5", xp: 10, date: "2 days ago" }, { name: "Possessive 's", mode: "Practice", score: "5/5", xp: 10, date: "3 days ago" }];
export const PIPO_LINES = ["Small steps count. You've got this!", "A little English, a little progress.", "Your next adventure is one click away.", "I'm rooting for you!", "Take your time. Learning isn't a race.", "New words, new possibilities!", "Mistakes help us learn.", "One activity can make a difference.", "Ready when you are!", "Look how far you've come!", "A fresh start is always welcome.", "Let's make today a learning day!"];

export const EXAM_QUESTIONS: ExamQuestion[] = [
  ...[
    { id: 1, prompt: "Choose the correct form of the verb.", sentence: "My sister _____ to school every morning.", options: ["walks", "walk", "walking", "walked"] },
    { id: 2, prompt: "Choose the word that completes the sentence.", sentence: "There isn't _____ milk in the fridge.", options: ["many", "a few", "much", "a"] },
    { id: 3, prompt: "Choose the correct preposition.", sentence: "Our English class starts _____ nine o'clock.", options: ["on", "at", "in", "by"] },
    { id: 4, prompt: "Choose the correct comparative adjective.", sentence: "This book is _____ than the one I read last week.", options: ["more interesting", "most interesting", "interesting", "interestingly"] },
  ].map(q => ({ ...q, type: "SINGLE_CHOICE" as const, options: q.options.map((text, i) => ({ key: String.fromCharCode(65 + i), text })) })),
  ...[
    { id: 5, sentence: "Which words describe things you can eat?", options: ["Bread", "Water", "Rice", "Milk"] },
    { id: 6, sentence: "Which sentences are in the past tense?", options: ["She visited London.", "He plays tennis.", "We watched a film.", "They are cooking."] },
    { id: 7, sentence: "Which words are adjectives?", options: ["Beautiful", "Quickly", "Friendly", "Run"] },
    { id: 8, sentence: "Which activities can help protect the environment?", options: ["Recycling paper", "Wasting water", "Planting trees", "Dropping litter"] },
  ].map(q => ({ ...q, type: "MULTIPLE_CHOICE" as const, prompt: "Select all the correct answers.", options: q.options.map((text, i) => ({ key: String.fromCharCode(65 + i), text })) })),
  ...[
    { id: 9, sentence: "The past tense of ‘go’ is ‘went’." },
    { id: 10, sentence: "We use ‘much’ with countable plural nouns." },
    { id: 11, sentence: "‘Taller’ is the comparative form of ‘tall’." },
    { id: 12, sentence: "The sentence ‘She don't like apples’ is grammatically correct." },
  ].map(q => ({ ...q, type: "TRUE_FALSE" as const, prompt: "Decide whether the statement is true or false.", options: [{ key: "TRUE", text: "True" }, { key: "FALSE", text: "False" }] })),
  ...[
    { id: 13, sentence: "She _____ English every day. (study)" },
    { id: 14, sentence: "Yesterday, we _____ to the park. (go)" },
    { id: 15, sentence: "My bag is _____ than yours. (heavy)" },
    { id: 16, sentence: "There _____ three books on the desk. (be)" },
  ].map(q => ({ ...q, type: "FILL_IN_BLANK" as const, prompt: "Complete the sentence with the correct form of the word.", options: [] })),
  ...[
    { id: 17, sentence: "Write one sentence about what you usually do after school." },
    { id: 18, sentence: "Rewrite using ‘because’: I stayed home. I was ill." },
    { id: 19, sentence: "Write a question for this answer: I go to school by bus." },
    { id: 20, sentence: "Write one sentence about something you did last weekend." },
  ].map(q => ({ ...q, type: "TYPE_ANSWER" as const, prompt: "Write your answer in the space below.", options: [] })),
];
