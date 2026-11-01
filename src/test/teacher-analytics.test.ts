import { describe, expect, it } from "vitest";
import { bucketIndex, difficulty, progressStatus, score10, type TeacherAttempt } from "@/lib/teacher-analytics";

const base = { status: "SUBMITTED", late: false } as TeacherAttempt;

describe("teacher analytics rules", () => {
  it("normalizes score to 10", () => expect(score10(9, 12)).toBe(7.5));
  it("no attempt before due is Not started, after due is Overdue", () => {
    expect(progressStatus(null, "2026-10-30", "2026-10-29")).toBe("NOT_STARTED");
    expect(progressStatus(null, "2026-10-30", "2026-11-01")).toBe("OVERDUE");
  });
  it("late submitted attempt shows Late", () => expect(progressStatus({ ...base, late: true }, "2026-10-30", "2026-11-01")).toBe("LATE"));
  it("buckets 0–4, 4–6, 6–8, 8–10", () => expect([3.9, 4, 6, 8, 10].map(bucketIndex)).toEqual([0, 1, 2, 3, 3]));
  it("difficulty thresholds", () => expect([0.39, 0.4, 0.9, 0.91].map(difficulty)).toEqual(["HARD", "NORMAL", "NORMAL", "TOO_EASY"]));
});
