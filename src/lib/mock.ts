import type { ExamQuestion, ExamAnswers } from "./exam";
import type { Student, AssignmentPreview } from "@/mocks/types";
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
export const STUDENT_SAMPLE: Student = { id: "sample-student", name: "Minh Anh", avatarUrl: null, grade: 6, className: "6A", xp: 1240, level: 7, nextLevelXp: 1300, streakDays: 7, streakAtRisk: false, classRank: 3, classSize: 28, dailyGoal: { target: 1, done: 0 } };
export const STUDENT_UNIT_PROGRESS = [65, 30, 0];
// Sample labels and instructions are presentation data, not assessment policy.
export const STUDENT_ASSIGNMENTS: AssignmentPreview[] = [
  { id: 1, title: "Grammar & vocabulary", unitName: "Food & Drink", dueInDays: 2, questionCount: 20, timeLimitMinutes: 20, status: "TODO", description: "Show what you've learned about food, quantities and everyday English. Read each question carefully and take your time.", teacherName: "Ms. Linh", dueLabel: "Wed, 28 Oct · 8:00 PM", instructions: ["Read each question carefully before answering.", "You can move between questions and check your answers before submitting.", "No hints or answer feedback are shown during the assignment."], samplePaper: true },
  { id: 2, title: "My daily routine", unitName: "Daily Routines", dueInDays: 5, questionCount: 15, timeLimitMinutes: 20, status: "IN_PROGRESS", description: "Use time expressions and the present simple to talk about a typical day.", teacherName: "Ms. Linh", dueLabel: "Sat, 31 Oct · 8:00 PM", instructions: ["Read the time expressions in each question carefully.", "Check your answers before submitting."], samplePaper: false },
  { id: 3, title: "Family & friends", unitName: "My Family", dueInDays: 7, questionCount: 12, timeLimitMinutes: 15, status: "TODO", description: "Review family vocabulary and possessives in everyday sentences.", teacherName: "Ms. Linh", dueLabel: "Mon, 2 Nov · 8:00 PM", instructions: ["Read each sentence carefully.", "Check spelling in your written answers."], samplePaper: false },
  { id: 4, title: "A week in my life", unitName: "Daily Routines", dueInDays: -3, questionCount: 15, timeLimitMinutes: 20, status: "SUBMITTED", description: "An assignment about everyday activities and frequency expressions.", teacherName: "Ms. Linh", dueLabel: "Fri, 23 Oct · 8:00 PM", instructions: [], samplePaper: false },
  { id: 5, title: "Meet my family", unitName: "My Family", dueInDays: -7, questionCount: 10, timeLimitMinutes: 15, status: "SUBMITTED", description: "Introduce your family using vocabulary from Unit 1.", teacherName: "Ms. Linh", dueLabel: "Mon, 19 Oct · 8:00 PM", instructions: [], samplePaper: false },
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

// ─── Teacher Assignment Results sample (presentation only, not live API data) ───
import type { AssignedStudent, AttemptQuestionResult, QuestionSnapshot, TeacherAttempt } from "@/lib/teacher-analytics";

export const TEACHER_ASSIGNMENT_SAMPLE = {
  id: 1,
  title: "Unit 3 · Grammar & vocabulary check",
  grade: "Grade 6",
  classes: ["6A", "6B", "6C"],
  status: "Closed",
  dueAt: "2026-10-30T23:59:00",
  timeLimitMinutes: 20,
  lastUpdated: "2026-11-01T08:00:00",
  now: "2026-11-01T08:00:00",
};

const opt = (...t: string[]) => t.map((text, i) => ({ key: "ABCD"[i] ?? "", text }));
export const TEACHER_QUESTIONS: QuestionSnapshot[] = [
  { position: 0, summary: "Example: to be", prompt: "She ___ a student.", type: "SINGLE_CHOICE", sectionKey: "grammar", sectionTitle: "Grammar", points: 0, example: true, options: opt("is", "are", "am", "be"), correct: ["A"] },
  { position: 1, summary: "Past Simple form", prompt: "Yesterday I ___ to the park.", type: "SINGLE_CHOICE", sectionKey: "grammar", sectionTitle: "Grammar", points: 1, example: false, options: opt("go", "went", "gone", "going"), correct: ["B"] },
  { position: 2, summary: "Irregular verbs", prompt: "Choose all irregular past forms.", type: "MULTIPLE_CHOICE", sectionKey: "grammar", sectionTitle: "Grammar", points: 2, example: false, options: opt("ate", "played", "saw", "walked"), correct: ["A", "C"] },
  { position: 3, summary: "Present continuous", prompt: "Look! The children ___ football.", type: "SINGLE_CHOICE", sectionKey: "grammar", sectionTitle: "Grammar", points: 1, example: false, options: opt("play", "are playing", "plays", "played"), correct: ["B"] },
  { position: 4, summary: "Past Simple negative", prompt: "We ___ (not / watch) TV last night.", type: "FILL_IN_BLANK", sectionKey: "grammar", sectionTitle: "Grammar", points: 1, example: false, correct: ["didn't watch"] },
  { position: 5, summary: "Food vocabulary", prompt: "Which one is a vegetable?", type: "SINGLE_CHOICE", sectionKey: "vocab", sectionTitle: "Vocabulary", points: 1, example: false, options: opt("Carrot", "Apple", "Bread", "Cheese"), correct: ["A"] },
  { position: 6, summary: "Countable nouns", prompt: "\"Rice\" is a countable noun.", type: "TRUE_FALSE", sectionKey: "vocab", sectionTitle: "Vocabulary", points: 1, example: false, options: [{ key: "T", text: "True" }, { key: "F", text: "False" }], correct: ["F"] },
  { position: 7, summary: "Daily routine verbs", prompt: "I ___ my teeth every morning.", type: "FILL_IN_BLANK", sectionKey: "vocab", sectionTitle: "Vocabulary", points: 1, example: false, correct: ["brush"] },
  { position: 8, summary: "Reading: main idea", prompt: "What is the passage mainly about?", type: "SINGLE_CHOICE", sectionKey: "reading", sectionTitle: "Reading", points: 1, example: false, options: opt("A school trip", "A birthday party", "A sports day", "A new pet"), correct: ["A"] },
  { position: 9, summary: "Reading: detail", prompt: "Tom arrived at the museum by bus.", type: "TRUE_FALSE", sectionKey: "reading", sectionTitle: "Reading", points: 1, example: false, options: [{ key: "T", text: "True" }, { key: "F", text: "False" }], correct: ["T"] },
  { position: 10, summary: "Reading inference", prompt: "How did Tom feel at the end of the trip?", type: "SINGLE_CHOICE", sectionKey: "reading", sectionTitle: "Reading", points: 1, example: false, options: opt("Bored", "Tired but happy", "Angry", "Scared"), correct: ["B"] },
  { position: 11, summary: "Write a past sentence", prompt: "Write one sentence about what you did last weekend.", type: "TYPE_ANSWER", sectionKey: "writing", sectionTitle: "Writing", points: 2, example: false, correct: ["Any correct Past Simple sentence"] },
  { position: 12, summary: "Word order", prompt: "Reorder: yesterday / visited / I / grandma / my", type: "TYPE_ANSWER", sectionKey: "writing", sectionTitle: "Writing", points: 1, example: false, correct: ["I visited my grandma yesterday"] },
];

const NAMES = [
  "Nguyen An", "Tran Binh", "Le Chi", "Pham Dung", "Hoang Giang", "Vu Ha", "Dang Hieu", "Bui Khanh", "Do Lan", "Ngo Long", "Duong Mai",
  "Ly Minh", "Mai Nam", "Trinh Ngoc", "Phan Oanh", "Cao Phuc", "Dinh Quang", "Ha Quynh", "Lam Son", "Luong Tam", "To Thao", "Kieu Trang",
  "Ta Tuan", "Quach Uyen", "Vo Van", "Chu Viet", "Lai Xuan", "Ong Yen", "Tang Bao", "Thai Cuong", "Lu Diep", "Mac Hanh",
];
export const TEACHER_STUDENTS: AssignedStudent[] = NAMES.map((name, i) => {
  const c = i < 11 ? "6A" : i < 22 ? "6B" : "6C";
  return { id: i + 1, name, classId: c.toLowerCase(), className: c };
});

// Hard-coded per-question difficulty so the sample shows realistic "hard" items.
const EASE: Record<number, number> = { 0: 1, 1: 0.34, 2: 0.29, 3: 0.7, 4: 0.55, 5: 0.95, 6: 0.72, 7: 0.78, 8: 0.9, 9: 0.82, 10: 0.41, 11: 0.75, 12: 0.7 };
const WRONG_TEXT: Record<number, string> = { 4: "not watched", 7: "wash", 11: "I go to the zoo.", 12: "I my grandma visited yesterday" };
const GOOD_TEXT: Record<number, string> = { 4: "didn't watch", 7: "brush", 11: "I played badminton with my dad.", 12: "I visited my grandma yesterday" };

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function answerFor(q: QuestionSnapshot, ok: boolean, r: () => number): string[] {
  if (q.options) {
    if (ok) return q.correct;
    if (q.type === "MULTIPLE_CHOICE") return r() > 0.5 ? ["A"] : ["A", "B"];
    const wrong = q.options.filter((o) => !q.correct.includes(o.key));
    return [wrong[Math.floor(r() * wrong.length)]!.key];
  }
  return [(ok ? GOOD_TEXT[q.position] : WRONG_TEXT[q.position]) ?? ""];
}

// Students 29–32 have no attempt (overdue); 27–28 are still in progress.
export const TEACHER_ATTEMPTS: TeacherAttempt[] = TEACHER_STUDENTS.slice(0, 28).map((s, i) => {
  const r = rng(i + 7);
  const ability = [0.15, 0.25, 0.3, -0.05, -0.1, 0.1, 0.05, -0.2, 0.2, 0, -0.25, 0.1][i % 12] ?? 0;
  const inProgress = i >= 26;
  const timedOut = i === 5 || i === 17;
  const late = i === 3 || i === 14 || i === 23;
  const questions: AttemptQuestionResult[] = TEACHER_QUESTIONS.map((q) => {
    const unanswered = !q.example && (timedOut ? q.position >= 10 : r() < 0.04);
    const ok = !unanswered && r() < Math.min(0.98, (EASE[q.position] ?? 0.5) + ability);
    const partial = !ok && !unanswered && q.points > 1 && r() < 0.5;
    const status = q.example ? "CORRECT" : unanswered ? "UNANSWERED" : ok ? "CORRECT" : partial ? "PARTIAL" : "INCORRECT";
    return {
      position: q.position,
      sectionKey: q.sectionKey,
      sectionTitle: q.sectionTitle,
      example: q.example,
      possiblePoints: q.points,
      earnedPoints: status === "CORRECT" ? q.points : status === "PARTIAL" ? q.points / 2 : 0,
      status,
      answer: unanswered ? [] : partial && q.type === "MULTIPLE_CHOICE" ? ["A"] : answerFor(q, ok, r),
    };
  });
  const possible = questions.reduce((a, q) => a + q.possiblePoints, 0);
  const day = late ? "31" : "29";
  const minutes = timedOut ? 20 : 9 + Math.floor(r() * 10);
  return {
    id: 100 + i,
    studentId: s.id,
    classIdAtStart: s.classId,
    classNameAtStart: s.className,
    status: inProgress ? "IN_PROGRESS" : timedOut ? "TIMED_OUT" : "SUBMITTED",
    startedAt: `2026-10-${day}T15:00:00`,
    submittedAt: inProgress || timedOut ? undefined : `2026-10-${day}T15:${String(minutes).padStart(2, "0")}:00`,
    timedOutAt: timedOut ? `2026-10-${day}T15:20:00` : undefined,
    late,
    totalPossiblePoints: possible,
    totalEarnedPoints: inProgress ? 0 : questions.reduce((a, q) => a + q.earnedPoints, 0),
    questions,
  };
});
import type { MascotItem, AvatarOption, RewardItem } from "@/mocks/types";
export const STREAK_DAYS_SAMPLE: boolean[] = [true,false,true,true,true,false,false,true,true,true,true,true,true,true];
export const MASCOTS_SAMPLE: MascotItem[] = [{id:"sprout",name:"Sprout Pipo",unlockLevel:1,mood:"happy"},{id:"leafy",name:"Leafy Pipo",unlockLevel:5,mood:"wave"},{id:"bloom",name:"Bloom Pipo",unlockLevel:10,mood:"think"},{id:"crown",name:"Crown Pipo",unlockLevel:15,mood:"cheer"}];
export const AVATARS_SAMPLE: AvatarOption[] = [{id:"a1",initials:"MA",tone:"primary"},{id:"a2",initials:"🦊",tone:"pink"},{id:"a3",initials:"🐼",tone:"info"},{id:"a4",initials:"🐢",tone:"success"},{id:"a5",initials:"🦉",tone:"teal"}];
export const REWARDS_SAMPLE: RewardItem[] = [{id:"r1",title:"Fox avatar",description:"A new profile look",unlockLevel:3,kind:"avatar"},{id:"r2",title:"Leafy Pipo",description:"Pipo grows a second leaf",unlockLevel:5,kind:"mascot"},{id:"r3",title:"Sunset theme",description:"Warm colours for your Home",unlockLevel:8,kind:"theme"},{id:"r4",title:"Bloom Pipo",description:"Pipo blossoms",unlockLevel:10,kind:"mascot"}];
