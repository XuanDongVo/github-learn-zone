import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, FileText, Flame, Search, ShieldCheck, Sparkles, Trophy, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pipo } from "@/components/student-foundation";
import { STUDENT_ASSIGNMENTS } from "@/lib/mock";
import { ASSIGNMENT_STATUS_LABEL, filterAssignments, type AssignmentFilter } from "@/lib/assignments";
import type { AssignmentPreview } from "@/mocks/types";

function AssignmentStatus({ assignment }: { assignment: AssignmentPreview }) {
  return <span className={`sa-status sa-status-${assignment.status.toLowerCase()}`}>{assignment.status === "SUBMITTED" ? <CheckCircle2 size={14}/> : assignment.status === "IN_PROGRESS" ? <Clock3 size={14}/> : <FileText size={14}/>} {ASSIGNMENT_STATUS_LABEL[assignment.status]}</span>;
}

const UNIT_TONES = ["orange", "teal", "pink"] as const;
const unitTone = (name: string) => UNIT_TONES[[...new Set(STUDENT_ASSIGNMENTS.map(a => a.unitName))].indexOf(name) % 3] ?? "orange";

export function StudentAssignments() {
  const [filter, setFilter] = useState<AssignmentFilter>("ALL");
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("all");
  const records = filterAssignments(STUDENT_ASSIGNMENTS, filter, query, unit);
  const units = [...new Set(STUDENT_ASSIGNMENTS.map(a => a.unitName))];
  const todo = STUDENT_ASSIGNMENTS.filter(a => a.status !== "SUBMITTED").length;
  const tabs: { value: AssignmentFilter; label: string }[] = [{ value: "ALL", label: "All" }, { value: "TODO", label: "To do" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "SUBMITTED", label: "Submitted" }];
  const count = (v: AssignmentFilter) => v === "ALL" ? STUDENT_ASSIGNMENTS.length : STUDENT_ASSIGNMENTS.filter(a => a.status === v).length;
  return <div className="qb-page">
    <header className="qb-hero">
      <div className="qb-hero-pipo"><Pipo mood={todo ? "wave" : "celebrate"} size={120}/></div>
      <div className="qb-hero-copy"><span className="qb-eyebrow"><Sparkles size={15}/>Your assignments</span><h1>{todo ? <>You have <mark>{todo} assignments</mark> waiting!</> : "All done — great job!"}</h1><p>Pick one, focus, and show what you know.</p></div>
    </header>
    <div className="qb-controls">
      <div className="qb-pills" role="tablist" aria-label="Assignment status">{tabs.map(t => <button key={t.value} role="tab" aria-selected={filter === t.value} className={`qb-pill ${filter === t.value ? "is-active" : ""}`} onClick={() => setFilter(t.value)}>{t.label}<span>{count(t.value)}</span></button>)}</div>
      <div className="qb-search"><Search size={18}/><Input aria-label="Search assignments" placeholder="Search assignments…" value={query} onChange={e => setQuery(e.target.value)}/></div>
    </div>
    <div className="qb-units" aria-label="Filter by unit">{["all", ...units].map(u => <button key={u} aria-pressed={unit === u} className={`qb-unit-chip tone-${u === "all" ? "navy" : unitTone(u)} ${unit === u ? "is-active" : ""}`} onClick={() => setUnit(u)}><BookOpen size={14}/>{u === "all" ? "All units" : u}</button>)}</div>
    <p className="qb-caption" aria-live="polite">{records.length} {records.length === 1 ? "assignment" : "assignments"}</p>
    {records.length ? <div className="qb-grid">{records.map(a => {
      const urgent = a.status !== "SUBMITTED" && a.dueInDays <= 2;
      const done = a.status === "SUBMITTED";
      return <article key={a.id} className={`qb-card tone-${unitTone(a.unitName)} ${done ? "is-done" : ""}`}>
        <div className="qb-card-top"><span className="qb-card-icon">{done ? <Trophy size={24}/> : a.status === "IN_PROGRESS" ? <Zap size={24}/> : <ClipboardList size={24}/>}</span><span className={`qb-badge ${done ? "badge-done" : urgent ? "badge-urgent" : a.status === "IN_PROGRESS" ? "badge-progress" : "badge-todo"}`}>{done ? <><CheckCircle2 size={14}/>Submitted</> : urgent ? <><Flame size={14}/>Due in {a.dueInDays} days</> : <>{ASSIGNMENT_STATUS_LABEL[a.status]}</>}</span></div>
        <span className="qb-unit-label">{a.unitName}</span>
        <h2><Link to="/student/assignments/$assignmentId" params={{ assignmentId: String(a.id) }}>{a.title}</Link></h2>
        <div className="qb-chips"><span><ClipboardList size={14}/>{a.questionCount} questions</span><span><Clock3 size={14}/>{a.timeLimitMinutes} min</span><span><CalendarDays size={14}/>{a.dueLabel}</span></div>
        <Link className={`qb-action ${done ? "qb-action-soft" : ""}`} to="/student/assignments/$assignmentId" params={{ assignmentId: String(a.id) }}>{done ? "View details" : a.status === "IN_PROGRESS" ? "Continue" : "Start"}<ArrowRight size={18}/></Link>
      </article>;
    })}</div> : <div className="qb-empty"><Pipo mood="think" size={110}/><h2>No assignments found</h2><p>Try another title or unit.</p><button className="qb-action" onClick={() => { setQuery(""); setUnit("all"); setFilter("ALL"); }}>Clear filters</button></div>}
    <p className="sa-sample-note"><ShieldCheck size={15}/>Sample assignments · Dates, teacher and progress are for preview only.</p>
  </div>;
}

export function StudentAssignmentIntro({ assignmentId }: { assignmentId: string }) {
  const assignment = STUDENT_ASSIGNMENTS.find(a => String(a.id) === assignmentId);
  if (!assignment) return <div className="sa-empty"><FileText size={32}/><h1>Assignment not found</h1><p>This assignment isn't in your sample workspace.</p><Button variant="outline" asChild><Link to="/student/assignments"><ArrowLeft/>Back to assignments</Link></Button></div>;
  const submitted = assignment.status === "SUBMITTED";
  return <div className="sa-page sa-intro"><Button variant="ghost" asChild className="sa-back"><Link to="/student/assignments"><ArrowLeft size={16}/>All assignments</Link></Button>
    <header className="sa-intro-heading"><div className="sa-intro-labels"><span className="sa-eyebrow">ENGLISH ASSIGNMENT</span><AssignmentStatus assignment={assignment}/></div><h1>{assignment.title}</h1><p><BookOpen size={16}/>{assignment.unitName}<span>·</span><UserRound size={16}/>{assignment.teacherName}</p></header>
    <div className="sa-intro-layout"><div className="sa-intro-content"><section><h2>About this assignment</h2><p>{assignment.description}</p></section><section><h2>Before you begin</h2><ol className="sa-instructions">{(submitted ? ["This sample assignment has been submitted.", "Submitted answers cannot be edited."] : assignment.instructions).map((instruction,i) => <li key={instruction}><span>{String(i+1).padStart(2,"0")}</span><p>{instruction}</p></li>)}</ol></section><div className="sa-assessment-note"><ShieldCheck size={23}/><div><strong>Your classwork, not a practice activity</strong><p>No hints, retries or XP during this assignment.</p></div></div></div>
      <aside className="sa-start-panel" aria-label="Assignment details"><div className="sa-panel-top"><span className="sa-paper-symbol"><ClipboardList size={26}/></span><h2>Assignment overview</h2></div><dl><div><dt><ClipboardList size={17}/>Questions</dt><dd>{assignment.questionCount}</dd></div><div><dt><Clock3 size={17}/>Time limit</dt><dd>{assignment.timeLimitMinutes} minutes</dd></div><div><dt><CalendarDays size={17}/>Due date</dt><dd>{assignment.dueLabel}</dd></div></dl>{submitted ? <div className="sa-submitted-note"><CheckCircle2 size={20}/><strong>Assignment submitted</strong><p>Result details aren't included in this preview.</p></div> : <><p className="sa-start-notice">Review the instructions before opening the assignment.</p>{assignment.samplePaper ? <Button className="sa-start-button" asChild><Link to="/">Open sample paper<ArrowRight/></Link></Button> : <Button disabled className="sa-start-button">{assignment.status === "IN_PROGRESS" ? "Continue assignment" : "Start assignment"}<ArrowRight/></Button>}<p className="sa-handoff-note">{assignment.samplePaper ? "Opens the existing sample exam. No new attempt is created." : "Preview only · No exam paper linked for this sample."}</p></>}<div className="sa-panel-footer"><ShieldCheck size={14}/>Sample assignment</div></aside>
    </div>
  </div>;
}