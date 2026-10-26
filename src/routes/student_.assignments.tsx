import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/shell";
import { StudentAssignments } from "@/components/student-assignments";
export const Route=createFileRoute("/student_/assignments")({head:()=>({meta:[{title:"Your Assignments — LearnUp"},{name:"description",content:"Review your English class assignments and upcoming work."},{property:"og:title",content:"Your Assignments — LearnUp"},{property:"og:description",content:"Your official English classwork and sample exam."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Page});
function Page(){return <StudentShell><StudentAssignments/></StudentShell>;}