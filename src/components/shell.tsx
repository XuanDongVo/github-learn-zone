import { Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, House, ChevronRight, CircleHelp, ArrowUpRight, Inbox, RotateCw, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function StudentShell({ children }: { children: ReactNode }) {
  return <div className="student-app">
    <aside className="student-sidebar">
      <Link to="/" className="brand"><span className="brand-mark"><GraduationCap size={22}/></span><span>learn<span className="text-primary">space</span><span className="brand-caption">A LITTLE EVERY DAY</span></span></Link>
      <div className="sidebar-section-label">YOUR WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <Button variant="ghost" asChild><Link to="/" activeOptions={{exact:true}} activeProps={{className:"nav-active"}}><House/>Home</Link></Button>
        <Button variant="ghost" asChild><Link to="/units" activeProps={{className:"nav-active"}}><BookOpen/>My learning</Link></Button>
      </nav>
      <div className="sidebar-footer"><span className="student-avatar">S</span><div><strong>Student workspace</strong><span>Grade 6 · English</span></div></div>
    </aside>
    <div className="student-body">
      <header className="student-topbar"><div className="topbar-label"><BookOpen size={16}/><span>Student space</span><ChevronRight size={13}/><strong>My learning</strong></div><span className="sample-label"><span/>Sample workspace</span></header>
      <main className="student-main">{children}</main>
      <footer className="page-footer"><span>Small steps. Meaningful learning.</span><span><GraduationCap size={15}/> Learnspace</span></footer>
    </div>
  </div>;
}
export function Crumbs({items}:{items:ReactNode[]}) {return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((it,i)=><span key={i}>{i>0&&<ChevronRight size={13}/>} {it}</span>)}</nav>}
export const Skeleton=({rows=3}:{rows?:number})=><div className="unit-grid">{Array.from({length:rows}).map((_,i)=><div className="unit-skeleton animate-pulse" key={i}/>)}</div>;
export function ErrorState({onRetry}:{onRetry:()=>void}){return <div className="empty-state"><AlertCircle/><h3>We couldn't load this right now.</h3><Button variant="outline" onClick={onRetry}><RotateCw/>Try again</Button></div>}
export function EmptyState({title,text}:{title:string;text:string}){return <div className="empty-state"><Inbox/><h3>{title}</h3><p>{text}</p></div>}
export type DemoState="data"|"loading"|"empty"|"error";
export function StateSwitch({value,onChange}:{value:DemoState;onChange:(v:DemoState)=>void}) {return <select aria-label="Preview state" value={value} onChange={e=>onChange(e.target.value as DemoState)} className="state-select"><option value="data">Sample data</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select>}
