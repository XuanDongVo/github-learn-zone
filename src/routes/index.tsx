import {createFileRoute} from "@tanstack/react-router";
import {AssignmentExam} from "@/components/assignment-exam";
export const Route=createFileRoute("/")({head:()=>({meta:[{title:"English Assignment Exam — LearnUp"},{name:"description",content:"Complete your English assignment, review every answer and submit with confidence."},{property:"og:title",content:"English Assignment Exam — LearnUp"},{property:"og:description",content:"A focused student assessment with question navigation and final review."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Home});
function Home(){return <AssignmentExam/>}
