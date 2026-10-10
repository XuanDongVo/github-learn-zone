import type { QuestionType } from "./domain";

export type ExamQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  sentence: string;
  options: { key: string; text: string }[];
};

export type ExamAnswers = Record<number, string[]>;

export function isExamAnswered(answer: string[] | undefined): boolean {
  return Boolean(answer?.length && answer.every(value => value.trim().length > 0));
}

export function toggleExamOption(answer: string[], key: string, multiple: boolean): string[] {
  if (multiple) {
    return answer.includes(key) ? answer.filter(value => value !== key) : [...answer, key];
  }
  return [key];
}

export function examAnswerSummary(question: ExamQuestion, answer: string[] | undefined): string {
  if (!isExamAnswered(answer)) return "No answer selected";
  
  const currentAnswer = answer ?? [];
  if (question.type === "FILL_IN_BLANK" || question.type === "TYPE_ANSWER") {
    return currentAnswer.join(", ");
  }

  return currentAnswer
    .map(value => question.options.find(option => option.key === value)?.text ?? value)
    .join(", ");
}

export function unansweredIds(ids: number[], answers: ExamAnswers): number[] {
  return ids.filter(id => !isExamAnswered(answers[id]));
}

export function formatExamTime(seconds: number): string {
  const remaining = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

export function canEditExam(seconds: number, submitted: boolean): boolean {
  return seconds > 0 && !submitted;
}
