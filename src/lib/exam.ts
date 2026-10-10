import type { QuestionType } from "./domain";

export type ExamQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  sentence: string;
  options: { key: string; text: string }[];
};

export type ExamAnswers = Record<number, string[]>;

export function isExamAnswered(answer: string[] | undefined, type: QuestionType = "SINGLE_CHOICE"): boolean {
  if (!answer || answer.length === 0) return false;
  
  switch (type) {
    case "FILL_IN_BLANK":
      // All blanks must be filled
      return answer.every(val => val.trim().length > 0);
    case "MULTIPLE_CHOICE":
      return answer.length > 0;
    default:
      return answer.length > 0 && answer[0].trim().length > 0;
  }
}

export function normalizeExamAnswer(answer: string[], type: QuestionType): string[] {
  switch (type) {
    case "SINGLE_CHOICE":
    case "TRUE_FALSE":
    case "TYPE_ANSWER":
      // Take only the first, trim it
      return answer.length > 0 ? [answer[0].trim()] : [];
    case "MULTIPLE_CHOICE":
      // Remove empty, unique
      return Array.from(new Set(answer.filter(val => val.trim().length > 0)));
    case "FILL_IN_BLANK":
      // Keep indices, just trim
      return answer.map(val => val.trim());
    default:
      return answer;
  }
}

export function toggleExamOption(answer: string[], key: string, multiple: boolean): string[] {
  if (multiple) {
    return answer.includes(key) ? answer.filter(value => value !== key) : [...answer, key];
  }
  return [key];
}

export function examAnswerSummary(question: ExamQuestion, answer: string[] | undefined): string {
  if (!isExamAnswered(answer, question.type)) return "No answer selected";
  
  const currentAnswer = answer ?? [];
  if (question.type === "FILL_IN_BLANK" || question.type === "TYPE_ANSWER") {
    return currentAnswer.join(", ");
  }

  return currentAnswer
    .map(value => question.options.find(option => option.key === value)?.text ?? value)
    .join(", ");
}

export function unansweredIds(questions: ExamQuestion[], answers: ExamAnswers): number[] {
  return questions
    .filter(q => !isExamAnswered(answers[q.id], q.type))
    .map(q => q.id);
}

export function formatExamTime(seconds: number): string {
  const remaining = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

export function canEditExam(seconds: number, submitted: boolean): boolean {
  return seconds > 0 && !submitted;
}
