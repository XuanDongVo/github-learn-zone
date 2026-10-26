import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/shell";
import { StudentAssignmentIntro } from "@/components/student-assignments";
import { STUDENT_ASSIGNMENTS } from "@/lib/mock";

export const Route = createFileRoute("/student_/assignments_/$assignmentId")({
  head: ({ params }) => {
    const assignment = STUDENT_ASSIGNMENTS.find(a => String(a.id) === params.assignmentId);
    const title = `${assignment?.title ?? "Assignment details"} — LearnUp`;
    const description = assignment?.description ?? "Review your English assignment instructions and details.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: Page,
});
function Page() { const { assignmentId } = Route.useParams(); return <StudentShell><StudentAssignmentIntro assignmentId={assignmentId}/></StudentShell>; }