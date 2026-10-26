import { describe, expect, it } from "vitest";
import { filterAssignments } from "@/lib/assignments";
import { STUDENT_ASSIGNMENTS } from "@/lib/mock";

describe("Assignment entry presentation", () => {
  it("filters by progress without including submitted assignments in to do", () => {
    expect(filterAssignments(STUDENT_ASSIGNMENTS, "TODO", "", "all").map(a => a.id)).toEqual([1,3]);
  });
  it("combines unit and case insensitive title filters", () => {
    expect(filterAssignments(STUDENT_ASSIGNMENTS, "ALL", " DAILY ", "Daily Routines").map(a => a.id)).toEqual([2]);
  });
  it("only links the matching sample paper rather than other assignment papers", () => {
    expect(STUDENT_ASSIGNMENTS.filter(a => a.samplePaper).map(a => a.id)).toEqual([1]);
  });
});