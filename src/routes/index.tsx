import {createFileRoute} from "@tanstack/react-router";
import {StudentShell} from "@/components/shell";
import {UnitGallery} from "@/components/unit-gallery";
export const Route=createFileRoute("/")({head:()=>({meta:[{title:"Student Home — Learnspace"},{name:"description",content:"Your English learning space. Discover units and practise at your own pace."},{property:"og:title",content:"Student Home — Learnspace"},{property:"og:description",content:"A little practice. A world of possibilities."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Home});
function Home(){return <StudentShell><UnitGallery home/></StudentShell>}
