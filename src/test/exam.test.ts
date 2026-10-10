import { describe, expect, it } from "vitest";
import { canEditExam, formatExamTime, unansweredIds, isExamAnswered, toggleExamOption, examAnswerSummary } from "@/lib/exam";
import { EXAM_QUESTIONS } from "@/lib/mock";

describe("Assignment exam rules", () => {
  it("includes all 20 directly navigable questions", () => {
    expect(EXAM_QUESTIONS.map(q => q.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
  it("review separates unanswered questions from answered questions", () => {
    expect(unansweredIds([1, 2, 3, 4], { 1: ["A"], 3: ["B"] })).toEqual([2, 4]);
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
  it("supports all five existing question types", () => {
    expect([...new Set(EXAM_QUESTIONS.map(q => q.type))]).toEqual(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "TYPE_ANSWER"]);
  });
  it("single choice replaces the previous selection", () => {
    expect(toggleExamOption(["A"], "B", false)).toEqual(["B"]);
  });
  it("multiple choice allows adding and removing selections", () => {
    expect(toggleExamOption(["A"], "C", true)).toEqual(["A", "C"]);
    expect(toggleExamOption(["A", "C"], "A", true)).toEqual(["C"]);
  });
  it("a false answer counts as answered", () => {
    expect(isExamAnswered(["FALSE"])).toBe(true);
  });
  it("empty and whitespace-only text remain unanswered", () => {
    expect(isExamAnswered([])).toBe(false);
    expect(isExamAnswered(["   "])).toBe(false);
    expect(isExamAnswered(["studies"])).toBe(true);
  });
  it("review includes every selected multiple-choice option", () => {
    const q = EXAM_QUESTIONS.find(q => q.id === 5);
    if (!q) throw new Error("Sample question missing");
    expect(examAnswerSummary(q, ["A", "C"])).toBe("Bread, Rice");
  });
});