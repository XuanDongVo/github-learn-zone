export type ExamAnswers = Record<number, string>;

export function unansweredIds(ids: number[], answers: ExamAnswers): number[] {
  return ids.filter(id => !answers[id]);
}

export function formatExamTime(seconds: number): string {
  const remaining = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

export function canEditExam(seconds: number, submitted: boolean): boolean {
  return seconds > 0 && !submitted;
}