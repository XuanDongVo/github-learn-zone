// Presentation contracts only. These do not add or change backend entities.
export type Student = { id: string; name: string; avatarUrl: string | null; grade: number; className: string; xp: number; level: number; nextLevelXp: number; streakDays: number; streakAtRisk: boolean; dailyGoal: { target: number; done: number }; classRank: number; classSize: number };
export type UnitSummary = { id: number; code: string; name: string; description?: string; coverUrl: string; displayOrder: number; sectionCount: number; activityCount: number; progressPercent: number; isLocked: boolean };
export type Activity = { id: number; name: string; description?: string; mode: "LEARNING" | "TRY_HARD" | "BOTH"; questionDifficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED"; totalQuestions: number; timeLimitSeconds: number | null; lives: number | null; topicIds: number[] };
export type Assignment = { id: number; title: string; unitName: string; dueAt: string; timeLimitMinutes: number; questionCount: number; attemptsAllowed: 1; status: "TODO" | "IN_PROGRESS" | "SUBMITTED" | "LATE" | "MISSED" };
export type LeaderboardEntry = { id: string; name: string; avatarUrl: string | null; rank: number; xp: number; isCurrentUser: boolean };
export type AssignmentPreview = {
  id: number; title: string; unitName: string; dueInDays: number;
  questionCount: number; timeLimitMinutes: number;
  status: "TODO" | "IN_PROGRESS" | "SUBMITTED";
  description: string; teacherName: string; dueLabel: string;
  instructions: string[]; samplePaper: boolean;
};