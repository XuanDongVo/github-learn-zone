// PROTOTYPE SAMPLE DATA — not real student data. Replace with GET /v1/units and GET /v1/activities?unitId=.
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
    lives: mode === "TRY_HARD" ? a.lives : undefined,
    questions: BANK.map((q, i) => ({ id: i + 1, position: i + 1, type: q.type, content: q.content, options: q.options, resolved: false, answerAttempts: 0, hintUsed: false, hasHint: mode === "LEARNING" && !!q.hint })),
  };
}
export const hintFor = (id: number) => BANK[id - 1].hint ?? "";

const norm = (s: string) => s.trim().toLowerCase().replace(/[’]/g, "'");
export function submitAnswer(s: ActivitySession, qid: number, answer: string[] | null): { session: ActivitySession; feedback: AnswerFeedback } {
  const src = BANK[qid - 1];
  const timedOut = answer === null;
  const correct = !timedOut && answer?.length === src.answer.length && src.answer.every((x) => answer?.some((y) => norm(y) === norm(x)));
  const questions = s.questions.map((q) => ({ ...q }));
  const q = questions[qid - 1];
  q.answerAttempts += 1;
  const maxAttempts = s.mode === "LEARNING" ? 2 : 1;
  const retryAvailable = !correct && q.answerAttempts < maxAttempts;
  if (q.answerAttempts === 1) q.firstCorrect = correct;
  if (!retryAvailable) { q.resolved = true; q.finalCorrect = correct; }
  let lives = s.lives;
  if (s.mode === "TRY_HARD" && !correct && !timedOut && lives != null) lives -= 1;
  const next: ActivitySession = {
    ...s, questions, lives,
    firstCorrectCount: questions.filter((x) => x.firstCorrect).length,
    finalCorrectCount: questions.filter((x) => x.finalCorrect).length,
  };
  if (lives === 0) next.status = "GAME_OVER";
  else if (questions.every((x) => x.resolved)) next.status = "COMPLETED";
  if (next.status !== "IN_PROGRESS" && s.mode === "TRY_HARD") next.score = next.firstCorrectCount * 100;
  const revealed = !correct && !retryAvailable;
  return { session: next, feedback: { correct, retryAvailable, answerRevealed: revealed, correctAnswer: revealed ? src.answer.map((k) => src.options.find((o) => o.key === k)?.content ?? k).join(", ") : undefined, explanation: correct || revealed ? src.explanation : undefined } };
}

export const delay = <T,>(v: T, ms = 450) => new Promise<T>((r) => setTimeout(() => r(v), ms));
