// PROTOTYPE SAMPLE DATA — not real student data. Replace with GET /v1/units and GET /v1/activities?unitId=.
import type { ExamQuestion, ExamAnswers } from "./exam";
import type { Activity, ActivitySession, ActivitySessionMode, AnswerFeedback, QuestionType, SelectionStrategy } from "./domain";

export type Unit = { type: "SINGLE_CHOICE", id: number; code: string; name: string; description?: string };

export const UNITS: Unit[] = [
  { type: "SINGLE_CHOICE", id: 1, code: "U1", name: "My Family", description: "Family members, possessives and simple present." },
  { type: "SINGLE_CHOICE", id: 2, code: "U2", name: "Daily Routines", description: "Time expressions and adverbs of frequency." },
  { type: "SINGLE_CHOICE", id: 3, code: "U3", name: "Food & Drink" },
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
    questions: BANK.map((q, i) => ({ type: "SINGLE_CHOICE", id: i + 1, position: i + 1, type: q.type, content: q.content, options: q.options, resolved: false, answerAttempts: 0, hintUsed: false, hasHint: mode === "LEARNING" && !!q.hint })),
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

// Standalone assignment-screen samples, not Activity records or a live exam API.
export const EXAM_SAMPLE = {
  title: "Unit 3 · English assessment",
  course: "Grade 7 English",
  subtitle: "Grammar & vocabulary",
  remainingSeconds: 18 * 60 + 42,
  currentQuestion: 1,
  answers: {} as ExamAnswers,
};

const EXAM_CHOICE_SAMPLES = [
  { type: "SINGLE_CHOICE", id: 1, prompt: "Choose the correct form of the verb.", sentence: "My sister _____ to school every morning.", options: ["walks", "walk", "walking", "walked"] },
  { type: "SINGLE_CHOICE", id: 2, prompt: "Choose the word that completes the sentence.", sentence: "There isn't _____ milk in the fridge.", options: ["many", "a few", "much", "a"] },
  { type: "SINGLE_CHOICE", id: 3, prompt: "Choose the correct preposition.", sentence: "Our English class starts _____ nine o'clock.", options: ["on", "at", "in", "by"] },
  { type: "SINGLE_CHOICE", id: 4, prompt: "Choose the correct comparative adjective.", sentence: "This book is _____ than the one I read last week.", options: ["more interesting", "most interesting", "interesting", "interestingly"] },
  { type: "SINGLE_CHOICE", id: 5, prompt: "Choose the correct word.", sentence: "We _____ visit our grandparents on Sundays.", options: ["usually", "yesterday", "tomorrow", "last"] },
  { type: "SINGLE_CHOICE", id: 6, prompt: "Choose the correct past tense form.", sentence: "Last weekend, they _____ a new museum.", options: ["visit", "visits", "visited", "visiting"] },
  { type: "SINGLE_CHOICE", id: 7, prompt: "Choose the word with the closest meaning to ‘begin’.", sentence: "The lesson will begin in five minutes.", options: ["finish", "start", "leave", "wait"] },
  { type: "SINGLE_CHOICE", id: 8, prompt: "Choose the correct possessive pronoun.", sentence: "This pencil belongs to me. It is _____.", options: ["mine", "my", "me", "I"] },
  { type: "SINGLE_CHOICE", id: 9, prompt: "Choose the correct article.", sentence: "She wants to be _____ astronaut.", options: ["an", "a", "the", "some"] },
  { type: "SINGLE_CHOICE", id: 10, prompt: "Choose the correct conjunction.", sentence: "I took an umbrella _____ it was raining.", options: ["but", "or", "because", "although"] },
  { type: "SINGLE_CHOICE", id: 11, prompt: "Choose the correct form of the verb.", sentence: "Look! The children _____ football.", options: ["plays", "are playing", "played", "play"] },
  { type: "SINGLE_CHOICE", id: 12, prompt: "Choose the correct word to complete the sentence.", sentence: "If it rains tomorrow, we _____ at home.", options: ["will stay", "would stay", "stayed", "are staying"] },
  { type: "SINGLE_CHOICE", id: 13, prompt: "Choose the correct question word.", sentence: "_____ do you go to the library? — Twice a week.", options: ["How often", "How much", "How long", "How far"] },
  { type: "SINGLE_CHOICE", id: 14, prompt: "Choose the opposite of ‘expensive’.", sentence: "The tickets were expensive.", options: ["cheap", "large", "quiet", "popular"] },
  { type: "SINGLE_CHOICE", id: 15, prompt: "Choose the correct modal verb.", sentence: "You _____ wear a helmet when you ride a bike.", options: ["should", "would", "might", "will"] },
  { type: "SINGLE_CHOICE", id: 16, prompt: "Choose the correct plural noun.", sentence: "There are three _____ sitting on the bench.", options: ["child", "children", "childs", "childrens"] },
  { type: "SINGLE_CHOICE", id: 17, prompt: "Choose the correct form of the verb.", sentence: "I enjoy _____ books in my free time.", options: ["reading", "read", "to reading", "reads"] },
  { type: "SINGLE_CHOICE", id: 18, prompt: "Choose the correct preposition.", sentence: "The picture is hanging _____ the wall.", options: ["on", "at", "to", "from"] },
  { type: "SINGLE_CHOICE", id: 19, prompt: "Choose the correct response.", sentence: "Would you like some orange juice?", options: ["Yes, please.", "Yes, I am.", "Yes, I do.", "Yes, it is."] },
  { type: "SINGLE_CHOICE", id: 20, prompt: "Choose the correct word to complete the sentence.", sentence: "This is the _____ day of my holiday.", options: ["best", "better", "good", "well"] },
].map(question => ({ ...question, options: question.options.map((text, index) => ({ key: String.fromCharCode(65 + index), text })) }));


export const EXAM_QUESTIONS: ExamQuestion[] = [
  ...EXAM_CHOICE_SAMPLES.slice(0, 4).map(q => ({ ...q, type: "SINGLE_CHOICE" as const })),
  ...[
    { type: "SINGLE_CHOICE", id: 5, sentence: "Which words describe things you can eat?", options: ["Bread", "Water", "Rice", "Milk"] },
    { type: "SINGLE_CHOICE", id: 6, sentence: "Which sentences are in the past tense?", options: ["She visited London.", "He plays tennis.", "We watched a film.", "They are cooking."] },
    { type: "SINGLE_CHOICE", id: 7, sentence: "Which words are adjectives?", options: ["Beautiful", "Quickly", "Friendly", "Run"] },
    { type: "SINGLE_CHOICE", id: 8, sentence: "Which activities can help protect the environment?", options: ["Recycling paper", "Wasting water", "Planting trees", "Dropping litter"] },
  ].map(q => ({ ...q, type: "MULTIPLE_CHOICE" as const, prompt: "Select all the correct answers.", options: q.options.map((text, i) => ({ key: String.fromCharCode(65 + i), text })) })),
  ...[
    { type: "SINGLE_CHOICE", id: 9, sentence: "The past tense of ‘go’ is ‘went’." },
    { type: "SINGLE_CHOICE", id: 10, sentence: "We use ‘much’ with countable plural nouns." },
    { type: "SINGLE_CHOICE", id: 11, sentence: "‘Taller’ is the comparative form of ‘tall’." },
    { type: "SINGLE_CHOICE", id: 12, sentence: "The sentence ‘She don't like apples’ is grammatically correct." },
  ].map(q => ({ ...q, type: "TRUE_FALSE" as const, prompt: "Decide whether the statement is true or false.", options: [{ key: "TRUE", text: "True" }, { key: "FALSE", text: "False" }] })),
  ...[
    { type: "SINGLE_CHOICE", id: 13, sentence: "She _____ English every day. (study)" },
    { type: "SINGLE_CHOICE", id: 14, sentence: "Yesterday, we _____ to the park. (go)" },
    { type: "SINGLE_CHOICE", id: 15, sentence: "My bag is _____ than yours. (heavy)" },
    { type: "SINGLE_CHOICE", id: 16, sentence: "There _____ three books on the desk. (be)" },
  ].map(q => ({ ...q, type: "FILL_IN_BLANK" as const, prompt: "Complete the sentence with the correct form of the word.", options: [] })),
  ...[
    { type: "SINGLE_CHOICE", id: 17, sentence: "Write one sentence about what you usually do after school." },
    { type: "SINGLE_CHOICE", id: 18, sentence: "Rewrite using ‘because’: I stayed home. I was ill." },
    { type: "SINGLE_CHOICE", id: 19, sentence: "Write a question for this answer: I go to school by bus." },
    { type: "SINGLE_CHOICE", id: 20, sentence: "Write one sentence about something you did last weekend." },
  ].map(q => ({ ...q, type: "TYPE_ANSWER" as const, prompt: "Write your answer in the space below.", options: [] })),
];
