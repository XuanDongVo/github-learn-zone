import {createFileRoute} from "@tanstack/react-router";
import {StudentShell} from "@/components/shell";
import {UnitGallery} from "@/components/unit-gallery";
export const Route=createFileRoute("/units")({head:()=>({meta:[{title:"My Learning — Learnspace"},{name:"description",content:"Discover published English units for your grade."},{property:"og:title",content:"My Learning — Learnspace"},{property:"og:description",content:"Choose a unit and learn one activity at a time."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Units});
function Units(){return <StudentShell><UnitGallery/></StudentShell>}
