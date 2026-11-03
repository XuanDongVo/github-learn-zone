import { Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, House, ChevronRight, Inbox, RotateCw, AlertCircle, Sparkles, ClipboardList, ChartNoAxesColumnIncreasing, Bell, Settings } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PipoProvider, StreakChip, XpChip, usePipo } from "./student-foundation";
import { STUDENT_SAMPLE } from "@/lib/mock";
import { levelFromXp } from "@/lib/student";

export function StudentShell({ children }: { children: ReactNode }) {
  return <PipoProvider><ShellContent>{children}</ShellContent></PipoProvider>;
}
function StudentNav({ mobile = false }: { mobile?: boolean }) {return <nav className={mobile ? "learnup-bottom-nav" : "sidebar-nav"} aria-label={mobile ? "Mobile navigation" : "Main navigation"}>
  <Button variant="ghost" asChild><Link to="/student" search={{state:"data"}} activeOptions={{exact:true}} activeProps={{className:"nav-active"}}><House/><span>Home</span></Link></Button>
  <Button variant="ghost" asChild><Link to="/units" activeProps={{className:"nav-active"}}><BookOpen/><span>Learning</span></Link></Button>
  <Button variant="ghost" asChild><Link to="/activities" search={{unitId:0}} activeProps={{className:"nav-active"}}><Sparkles/><span>Activities</span></Link></Button>
  <Button variant="ghost" asChild><Link to="/student/assignments" activeProps={{className:"nav-active"}}><ClipboardList/><span>Assignments</span></Link></Button>
  <Button variant="ghost" asChild><Link to="/student/progress" activeProps={{className:"nav-active"}}><ChartNoAxesColumnIncreasing/><span>Progress</span></Link></Button>
</nav>;}
function ShellContent({children}:{children:ReactNode}) {const {enabled,toggle}=usePipo();const [dialog,setDialog]=useState<"profile"|"notifications"|null>(null);
 return <div className="student-app learnup-theme topnav-app"><a className="student-skip" href="#student-content">Skip to content</a><div className="student-body"><header className="topnav-bar"><Link to="/student" search={{state:"data"}} className="brand"><span className="brand-mark"><GraduationCap size={22}/></span><span>Learn<span className="text-primary">Up</span></span></Link><StudentNav/><div className="topnav-right"><XpChip xp={STUDENT_SAMPLE.xp}/><StreakChip days={STUDENT_SAMPLE.streakDays}/><Button variant="ghost" size="icon" className="topnav-icon" aria-label="Notifications" onClick={()=>setDialog("notifications")}><Bell size={19}/></Button><Button variant="ghost" className="topnav-avatar" aria-label="Open profile" onClick={()=>setDialog("profile")}><span className="student-avatar">MA</span><span className="topnav-level">Lv {levelFromXp(STUDENT_SAMPLE.xp)}</span></Button></div></header><main id="student-content" className="student-main">{children}</main><footer className="page-footer"><span>Small steps. Meaningful learning.</span><span><GraduationCap size={15}/>LearnUp · Sample workspace</span></footer></div><StudentNav mobile/><Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null);}}><DialogContent className="learnup-theme student-dialog"><DialogTitle>{dialog==="profile"?STUDENT_SAMPLE.name:"Notifications"}</DialogTitle><DialogDescription>{dialog==="profile"?`Sample student · Grade 6 · Class ${STUDENT_SAMPLE.className}`:"You're all caught up. No new notifications in this sample workspace."}</DialogDescription>{dialog==="profile"&&<><XpChip xp={STUDENT_SAMPLE.xp}/><Button variant="outline" aria-pressed={enabled} onClick={toggle}><Settings/>Mascot {enabled?"on":"off"}</Button></>}</DialogContent></Dialog></div>;
}
export function Crumbs({items}:{items:ReactNode[]}) {return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((it,i)=><span key={i}>{i>0&&<ChevronRight size={13}/>} {it}</span>)}</nav>}
export const Skeleton=({rows=3}:{rows?:number})=><div className="unit-grid">{Array.from({length:rows}).map((_,i)=><div className="unit-skeleton animate-pulse" key={i}/>)}</div>;
export function ErrorState({onRetry}:{onRetry:()=>void}){return <div className="empty-state"><AlertCircle/><h3>We couldn't load this right now.</h3><Button variant="outline" onClick={onRetry}><RotateCw/>Try again</Button></div>}
export function EmptyState({title,text}:{title:string;text:string}){return <div className="empty-state"><Inbox/><h3>{title}</h3><p>{text}</p></div>}
export type DemoState="data"|"loading"|"empty"|"error";
export function StateSwitch({value,onChange}:{value:DemoState;onChange:(v:DemoState)=>void}) {return <select aria-label="Preview state" value={value} onChange={e=>onChange(e.target.value as DemoState)} className="state-select"><option value="data">Sample data</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select>}
