// Pure, read-only analytics helpers for the teacher Assignment Results screen.
// Grading is already persisted; these helpers only aggregate stored results.

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
export type ProgressStatus = "SUBMITTED" | "LATE" | "TIMED_OUT" | "IN_PROGRESS" | "NOT_STARTED" | "OVERDUE";
export type PartStatus = "CORRECT" | "PARTIAL" | "INCORRECT" | "UNANSWERED";
export type TeacherQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK" | "TYPE_ANSWER";

export interface AttemptQuestionResult {
  position: number;
  sectionKey: string;
  sectionTitle: string;
  example: boolean;
  possiblePoints: number;
  earnedPoints: number;
  status: PartStatus;
  /** Student answer as shown to the teacher (choice keys or original text). */
  answer: string[];
}

export interface TeacherAttempt {
  id: number;
  studentId: number;
  classIdAtStart: string;
  classNameAtStart: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  timedOutAt?: string;
  late: boolean;
  totalPossiblePoints: number;
  totalEarnedPoints: number;
  questions: AttemptQuestionResult[];
}

export interface AssignedStudent {
  id: number;
  name: string;
  classId: string;
  className: string;
}

export interface QuestionSnapshot {
  position: number;
  summary: string;
  prompt: string;
  type: TeacherQuestionType;
  sectionKey: string;
  sectionTitle: string;
  points: number;
  example: boolean;
  options?: { key: string; text: string }[];
  correct: string[];
}

export interface StudentRow {
  student: AssignedStudent;
  attempt: TeacherAttempt | null;
  status: ProgressStatus;
  score: number | null;
  percentage: number | null;
  durationMinutes: number | null;
  unanswered: number | null;
  vsClass: number | null;
}

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  SUBMITTED: "Submitted",
  LATE: "Late",
  TIMED_OUT: "Timed out",
  IN_PROGRESS: "In progress",
  NOT_STARTED: "Not started",
  OVERDUE: "Overdue",
};
export const STATUS_ORDER: ProgressStatus[] = ["SUBMITTED", "LATE", "TIMED_OUT", "IN_PROGRESS", "NOT_STARTED", "OVERDUE"];
export const BUCKETS = ["0–4", "4–6", "6–8", "8–10"] as const;

export function score10(earned: number, possible: number): number {
  if (possible <= 0) return 0;
  return Math.round((earned / possible) * 100) / 10;
}

export function progressStatus(attempt: TeacherAttempt | null, dueAt: string, now: string): ProgressStatus {
  if (!attempt) return new Date(now) > new Date(dueAt) ? "OVERDUE" : "NOT_STARTED";
  if (attempt.status === "IN_PROGRESS") return "IN_PROGRESS";
  if (attempt.status === "TIMED_OUT") return "TIMED_OUT";
  return attempt.late ? "LATE" : "SUBMITTED";
}

/** Completed = graded attempts; IN_PROGRESS is excluded from score analytics. */
export function isCompleted(a: TeacherAttempt | null): a is TeacherAttempt {
  return !!a && a.status !== "IN_PROGRESS";
}

export function bucketIndex(score: number): number {
  if (score < 4) return 0;
  if (score < 6) return 1;
  if (score < 8) return 2;
  return 3;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
}

export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export type Difficulty = "HARD" | "NORMAL" | "TOO_EASY";
export function difficulty(correctRate: number): Difficulty {
  if (correctRate < 0.4) return "HARD";
  if (correctRate > 0.9) return "TOO_EASY";
  return "NORMAL";
}
export const LOW_CONFIDENCE_N = 5;

function minutesBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export function buildStudentRows(
  students: AssignedStudent[],
  attempts: TeacherAttempt[],
  dueAt: string,
  now: string,
): StudentRow[] {
  const byStudent = new Map(attempts.map((a) => [a.studentId, a]));
  const rows: StudentRow[] = students.map((student) => {
    const attempt = byStudent.get(student.id) ?? null;
    const done = isCompleted(attempt);
    const end = attempt?.submittedAt ?? attempt?.timedOutAt;
    return {
      student,
      attempt,
      status: progressStatus(attempt, dueAt, now),
      score: done ? score10(attempt.totalEarnedPoints, attempt.totalPossiblePoints) : null,
      percentage: done ? Math.round((attempt.totalEarnedPoints / attempt.totalPossiblePoints) * 100) : null,
      durationMinutes: attempt && end ? minutesBetween(attempt.startedAt, end) : null,
      unanswered: done ? attempt.questions.filter((q) => !q.example && q.status === "UNANSWERED").length : null,
      vsClass: null,
    };
  });
  const classAvg = new Map<string, number>();
  for (const cid of new Set(rows.map((r) => classKey(r)))) {
    const avg = mean(rows.filter((r) => classKey(r) === cid && r.score !== null).map((r) => r.score!));
    if (avg !== null) classAvg.set(cid, avg);
  }
  for (const r of rows) {
    const avg = classAvg.get(classKey(r));
    if (r.score !== null && avg !== undefined) r.vsClass = Math.round((r.score - avg) * 10) / 10;
  }
  return rows;
}

/** classIdAtStart is the historical class identity when an attempt exists. */
function classKey(r: StudentRow) {
  return r.attempt?.classIdAtStart ?? r.student.classId;
}
export function rowClassName(r: StudentRow) {
  return r.attempt?.classNameAtStart ?? r.student.className;
}

export interface QuestionStat {
  question: QuestionSnapshot;
  n: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
  correctRate: number;
  difficulty: Difficulty;
  lowConfidence: boolean;
  answerCounts: Map<string, number>;
}

export function questionStats(questions: QuestionSnapshot[], attempts: TeacherAttempt[]): QuestionStat[] {
  const done = attempts.filter(isCompleted);
  return questions
    .filter((q) => !q.example)
    .map((question) => {
      const results = done
        .map((a) => a.questions.find((x) => x.position === question.position))
        .filter((x): x is AttemptQuestionResult => !!x);
      const count = (s: PartStatus) => results.filter((r) => r.status === s).length;
      const n = results.length;
      const correct = count("CORRECT");
      const answerCounts = new Map<string, number>();
      for (const r of results) {
        for (const raw of r.answer) {
          const key = question.options ? raw : raw.trim().toLowerCase();
          answerCounts.set(key, (answerCounts.get(key) ?? 0) + 1);
        }
      }
      const correctRate = n ? correct / n : 0;
      return {
        question,
        n,
        correct,
        partial: count("PARTIAL"),
        incorrect: count("INCORRECT"),
        unanswered: count("UNANSWERED"),
        correctRate,
        difficulty: difficulty(correctRate),
        lowConfidence: n < LOW_CONFIDENCE_N,
        answerCounts,
      };
    });
}

export interface SectionStat {
  key: string;
  title: string;
  scorePct: number;
  correctPct: number;
  unansweredPct: number;
  students: number;
  questionCount: number;
}

export function sectionStats(attempts: TeacherAttempt[]): SectionStat[] {
  const done = attempts.filter(isCompleted);
  const map = new Map<string, { title: string; earned: number; possible: number; correct: number; unanswered: number; total: number; positions: Set<number> }>();
  for (const a of done) {
    for (const q of a.questions) {
      if (q.example) continue;
      const s = map.get(q.sectionKey) ?? { title: q.sectionTitle, earned: 0, possible: 0, correct: 0, unanswered: 0, total: 0, positions: new Set<number>() };
      s.earned += q.earnedPoints;
      s.possible += q.possiblePoints;
      s.total += 1;
      if (q.status === "CORRECT") s.correct += 1;
      if (q.status === "UNANSWERED") s.unanswered += 1;
      s.positions.add(q.position);
      map.set(q.sectionKey, s);
    }
  }
  return [...map.entries()].map(([key, s]) => ({
    key,
    title: s.title,
    scorePct: s.possible ? Math.round((s.earned / s.possible) * 100) : 0,
    correctPct: s.total ? Math.round((s.correct / s.total) * 100) : 0,
    unansweredPct: s.total ? Math.round((s.unanswered / s.total) * 100) : 0,
    students: done.length,
    questionCount: s.positions.size,
  }));
}

export interface ClassStat {
  classId: string;
  className: string;
  students: number;
  completed: number;
  average: number | null;
  median: number | null;
  late: number;
  buckets: number[];
}

export function classStats(rows: StudentRow[]): ClassStat[] {
  const groups = new Map<string, StudentRow[]>();
  for (const r of rows) {
    const id = r.attempt?.classIdAtStart ?? r.student.classId;
    groups.set(id, [...(groups.get(id) ?? []), r]);
  }
  return [...groups.entries()]
    .map(([classId, list]) => {
      const scores = list.filter((r) => r.score !== null).map((r) => r.score!);
      const buckets = [0, 0, 0, 0];
      scores.forEach((s) => (buckets[bucketIndex(s)] += 1));
      return {
        classId,
        className: rowClassName(list[0]),
        students: list.length,
        completed: scores.length,
        average: mean(scores),
        median: median(scores),
        late: list.filter((r) => r.status === "LATE").length,
        buckets,
      };
    })
    .sort((a, b) => a.className.localeCompare(b.className));
}

export type WarningTarget =
  | { tab: "students"; filter: "LOW" | "NOT_STARTED" | "LATE" }
  | { tab: "questions"; position: number }
  | { tab: "sections"; key: string };
export interface AttentionItem {
  id: string;
  severity: "high" | "medium";
  text: string;
  action: string;
  target: WarningTarget;
}

/** Deterministic warnings derived from stored results — not AI insight. */
export function needsAttention(rows: StudentRow[], qs: QuestionStat[], sections: SectionStat[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const low = rows.filter((r) => r.score !== null && r.score < 5).length;
  if (low) items.push({ id: "low", severity: "high", text: `${low} students scored below 5`, action: "View students", target: { tab: "students", filter: "LOW" } });
  for (const q of qs.filter((x) => x.difficulty === "HARD" && !x.lowConfidence).sort((a, b) => a.correctRate - b.correctRate).slice(0, 3)) {
    items.push({ id: `q${q.question.position}`, severity: "high", text: `Question ${q.question.position} has only ${Math.round(q.correctRate * 100)}% correct`, action: "View question analysis", target: { tab: "questions", position: q.question.position } });
  }
  for (const s of sections.filter((x) => x.scorePct < 65)) {
    items.push({ id: `s${s.key}`, severity: "medium", text: `${s.title} section average is ${s.scorePct}%`, action: "View section analysis", target: { tab: "sections", key: s.key } });
  }
  const notStarted = rows.filter((r) => r.status === "NOT_STARTED" || r.status === "OVERDUE").length;
  if (notStarted) items.push({ id: "ns", severity: "medium", text: `${notStarted} students have not started`, action: "View students", target: { tab: "students", filter: "NOT_STARTED" } });
  const late = rows.filter((r) => r.status === "LATE").length;
  if (late) items.push({ id: "late", severity: "medium", text: `${late} submissions were late`, action: "View students", target: { tab: "students", filter: "LATE" } });
  return items;
}
