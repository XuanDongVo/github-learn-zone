// Mirrors client-e-learning/src/types/activity.ts and activity-session.ts (E-Learning repo).
export type ActivityMode = "LEARNING" | "TRY_HARD" | "BOTH";
export type ActivitySessionMode = "LEARNING" | "TRY_HARD";
export type ActivitySessionStatus = "IN_PROGRESS" | "COMPLETED" | "GAME_OVER" | "ABANDONED";
export type SelectionStrategy = "RANDOM" | "WEAKNESS_PRIORITY";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_BLANK" | "TYPE_ANSWER";

export type Activity = {
  id: number;
  gradeId: number;
  gradeName: string;
  unitId: number;
  unitCode: string;
  unitName: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  totalQuestions: number;
  mode: ActivityMode;
  timeLimitSeconds?: number;
  lives?: number;
  availableSelectionStrategies: SelectionStrategy[];
};

export type ActivitySessionQuestion = {
  id: number;
  position: number;
  type: QuestionType;
  content: string;
  options: { key: string; content: string }[];
  resolved: boolean;
  answerAttempts: number;
  firstCorrect?: boolean;
  finalCorrect?: boolean;
  hintUsed: boolean;
  hasHint: boolean;
};

export type ActivitySession = {
  id: number;
  status: ActivitySessionStatus;
  mode: ActivitySessionMode;
  selectionStrategy: SelectionStrategy;
  totalQuestions: number;
  firstCorrectCount: number;
  finalCorrectCount: number;
  hintUsedCount: number;
  score?: number;
  lives?: number;
  questions: ActivitySessionQuestion[];
};

export type AnswerFeedback = {
  correct: boolean;
  retryAvailable: boolean;
  answerRevealed: boolean;
  correctAnswer?: string;
  explanation?: string;
};

export const MODE_LABEL: Record<ActivitySessionMode, string> = { LEARNING: "Learning", TRY_HARD: "Try Hard" };
export const STRATEGY_LABEL: Record<SelectionStrategy, string> = { RANDOM: "Random order", WEAKNESS_PRIORITY: "Focus on weak spots" };
export const supportedModes = (m: ActivityMode): ActivitySessionMode[] => (m === "BOTH" ? ["LEARNING", "TRY_HARD"] : [m]);
