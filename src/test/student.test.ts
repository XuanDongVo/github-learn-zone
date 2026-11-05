import { describe, it, expect } from "vitest";
import { levelFromXp, nextUp, pipoStage } from "@/lib/student";
describe("Student presentation rules", () => {
  it("prioritizes the soonest unfinished assignment within 3 days", () => { expect(nextUp([{ dueInDays: 4, status: "TODO" }, { dueInDays: 3, status: "TODO" }, { dueInDays: 1, status: "SUBMITTED" }, { dueInDays: 2, status: "IN_PROGRESS" }])?.dueInDays).toBe(2); });
  it("falls back to activity outside the 3-day window", () => { expect(nextUp([{ dueInDays: 4, status: "TODO" }])).toBeUndefined(); });
  it("uses sample XP thresholds independently of exam scores", () => { expect(levelFromXp(1240)).toBe(7); expect(levelFromXp(1400)).toBe(8); });
  it("changes Pipo growth at levels 5, 10 and 15", () => { expect([4, 5, 9, 10, 14, 15].map(pipoStage)).toEqual([1, 2, 2, 3, 3, 4]); });
});import { levelProgress, isUnlocked } from "@/lib/student";
describe("rewards", () => { it("level progress within 200 XP", () => { expect(levelProgress(1240).into).toBe(40); }); it("unlocks at level", () => { expect(isUnlocked(5, 5)).toBe(true); expect(isUnlocked(4, 5)).toBe(false); }); });
