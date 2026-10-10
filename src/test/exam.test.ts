import { describe, expect, it } from "vitest";
import { canEditExam, formatExamTime, unansweredIds } from "@/lib/exam";
import { EXAM_QUESTIONS } from "@/lib/mock";

describe("Assignment exam rules", () => {
  it("includes all 20 directly navigable questions", () => {
    expect(EXAM_QUESTIONS.map(q => q.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
  it("review separates unanswered questions from answered questions", () => {
    expect(unansweredIds([1, 2, 3, 4], { 1: "A", 3: "B" })).toEqual([2, 4]);
  });
  it("stops accepting answers when the countdown expires", () => {
    expect(canEditExam(0, false)).toBe(false);
    expect(canEditExam(1, false)).toBe(true);
  });
  it("does not allow changes after submission", () => {
    expect(canEditExam(100, true)).toBe(false);
  });
  it("formats the countdown without negative time", () => {
    expect(formatExamTime(1122)).toBe("18:42");
    expect(formatExamTime(-1)).toBe("00:00");
  });
});