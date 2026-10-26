import type { AssignmentPreview } from "@/mocks/types";

export type AssignmentFilter = "ALL" | AssignmentPreview["status"];
export const ASSIGNMENT_STATUS_LABEL = { TODO: "To do", IN_PROGRESS: "In progress", SUBMITTED: "Submitted" };
export function filterAssignments(records: AssignmentPreview[], status: AssignmentFilter, query: string, unit: string) {
  const search = query.trim().toLowerCase();
  return records.filter(a => (status === "ALL" || a.status === status) && (unit === "all" || a.unitName === unit) && `${a.title} ${a.unitName}`.toLowerCase().includes(search));
}