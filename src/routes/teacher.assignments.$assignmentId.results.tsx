import { createFileRoute } from "@tanstack/react-router";
import { TeacherResults } from "@/components/teacher-results";

export const Route = createFileRoute("/teacher/assignments/$assignmentId/results")({
  head: () => ({
    meta: [
      { title: "Assignment Results — Teacher | LearnUp" },
      { name: "description", content: "Review completion, scores, difficult questions, weak sections and student attempts for an assignment." },
      { property: "og:title", content: "Assignment Results — Teacher | LearnUp" },
      { property: "og:description", content: "Teacher analytics for assignment completion, scores and student attempts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherResults,
});
