import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, BookOpen, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UNITS, ACTIVITIES } from "@/lib/mock";
import { Skeleton, ErrorState, EmptyState, StateSwitch, type DemoState } from "./shell";
import landscape from "@/assets/unit-landscape.jpg";

export function UnitGallery({home=false}:{home?:boolean}) {
 const [state,setState]=useState<DemoState>("data");
 return <>
 {home&&<section className="welcome-section"><div className="eyebrow"><span/> YOUR NEXT CHAPTER</div><h1>A little practice.<br/><span className="text-muted-foreground">A world of possibilities.</span></h1><div className="welcome-bottom"><p>Welcome back. Make some room for something new today.</p><Button asChild variant="outline"><Link to="/units">Explore my learning <ArrowUpRight/></Link></Button></div></section>}
 <section className="learning-section">
 <div className="section-heading"><div><div className="eyebrow">MY LEARNING</div><h2>{home?"Your units":"Find your next chapter"}</h2><p>Choose a unit and take it one activity at a time.</p></div><div className="heading-controls"><span className="grade-label"><BookOpen size={14}/>English · Grade 6</span><StateSwitch value={state} onChange={setState}/></div></div>
 {state==="loading"&&<Skeleton/>}{state==="error"&&<ErrorState onRetry={()=>setState("data")}/>}{state==="empty"&&<EmptyState title="Your next chapter is on its way" text="No published units are available for your grade yet."/>}
 {state==="data"&&<div className="unit-grid">{UNITS.map((u,i)=>{
 const count=ACTIVITIES.filter(a=>a.unitId===u.id&&a.status==="PUBLISHED").length;
 return <article className="unit-card" key={u.id}>
 <div className={`unit-cover cover-${i}`}><span className="unit-number-label">UNIT {String(i+1).padStart(2,"0")}</span>{i===1?<div className="typographic-cover"><span>02</span><BookOpen size={96} strokeWidth={0.8}/></div>:<img src={landscape} alt="Illustrated green hills and a quiet lakeside cottage" width={1536} height={1024} loading="lazy"/>}<span className="cover-subject">ENGLISH FOUNDATIONS</span></div>
 <div className="unit-content"><h3>{u.name}</h3><p>{u.description??"Discover useful words and expressions for food and drink."}</p><div className="unit-meta"><Sparkles size={15}/><span>{count} {count===1?"activity":"activities"}</span><span className="meta-dot">·</span><span>Practice at your pace</span></div><Button asChild className="open-unit"><Link to="/activities" search={{unitId:u.id}}>Open unit<ArrowRight/></Link></Button></div>
 </article>})}</div>}
 </section>
 <div className="learning-footnote"><span className="footnote-icon"><Sparkles size={18}/></span><div><strong>No pressure. Just progress.</strong><p>Your activities are always here when you're ready to practise again.</p></div></div>
 </>;
}
