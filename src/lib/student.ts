export function levelFromXp(xp: number) { return Math.max(1, Math.floor(Math.max(0, xp) / 200) + 1); }
export function pipoStage(level: number): 1 | 2 | 3 | 4 { return level >= 15 ? 4 : level >= 10 ? 3 : level >= 5 ? 2 : 1; }
export function nextUp<T extends { dueInDays: number; status: string }>(assignments: T[]): T | undefined {
  return assignments.filter(a => a.dueInDays >= 0 && a.dueInDays <= 3 && (a.status === "TODO" || a.status === "IN_PROGRESS")).sort((a, b) => a.dueInDays - b.dueInDays)[0];
}