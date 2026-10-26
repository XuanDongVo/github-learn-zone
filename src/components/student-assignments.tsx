import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, FileText, Search, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STUDENT_ASSIGNMENTS } from "@/lib/mock";
import { ASSIGNMENT_STATUS_LABEL, filterAssignments, type AssignmentFilter } from "@/lib/assignments";
import type { AssignmentPreview } from "@/mocks/types";

function AssignmentStatus({ assignment }: { assignment: AssignmentPreview }) {
  return <span className={`sa-status sa-status-${assignment.status.toLowerCase()}`}>{assignment.status === "SUBMITTED" ? <CheckCircle2 size={14}/> : assignment.status === "IN_PROGRESS" ? <Clock3 size={14}/> : <FileText size={14}/>} {ASSIGNMENT_STATUS_LABEL[assignment.status]}</span>;
}

export function StudentAssignments() {
  const [filter, setFilter] = useState<AssignmentFilter>("ALL");
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("all");
  const records = filterAssignments(STUDENT_ASSIGNMENTS, filter, query, unit);
  const tabs: { value: AssignmentFilter; label: string }[] = [{ value: "ALL", label: "All assignments" }, { value: "TODO", label: "To do" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "SUBMITTED", label: "Submitted" }];
  return <div className="sa-page">
    <header className="sa-heading"><span className="sa-eyebrow"><ClipboardList size={16}/>YOUR CLASSWORK</span><h1>Your assignments</h1><p>A clear view of what's next, and what you've finished.</p></header>
    <div className="sa-overview" aria-label="Assignment summary">{tabs.slice(1).map(t => <div key={t.value}><span className={`sa-summary-icon sa-status-${t.value.toLowerCase()}`}>{t.value === "SUBMITTED" ? <CheckCircle2/> : t.value === "IN_PROGRESS" ? <Clock3/> : <ClipboardList/>}</span><div><strong>{STUDENT_ASSIGNMENTS.filter(a => a.status === t.value).length}</strong><span>{t.label}</span></div></div>)}</div>
    <Tabs value={filter} onValueChange={value => { if (tabs.some(t => t.value === value)) setFilter(value as AssignmentFilter); }}>
      <div className="sa-list-toolbar"><TabsList className="sa-tabs" aria-label="Assignment status">{tabs.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}<span>{t.value === "ALL" ? STUDENT_ASSIGNMENTS.length : STUDENT_ASSIGNMENTS.filter(a => a.status === t.value).length}</span></TabsTrigger>)}</TabsList></div>
      <div className="sa-filters"><div className="sa-search"><Search size={18}/><Input aria-label="Search assignments" placeholder="Search assignments…" value={query} onChange={e => setQuery(e.target.value)}/></div><select className="sa-unit-select" aria-label="Filter by unit" value={unit} onChange={e => setUnit(e.target.value)}><option value="all">All units</option>{[...new Set(STUDENT_ASSIGNMENTS.map(a => a.unitName))].map(name => <option key={name}>{name}</option>)}</select></div>
      <TabsContent value={filter} className="sa-list"><div className="sa-list-caption"><span aria-live="polite">{records.length} {records.length === 1 ? "assignment" : "assignments"}</span><span>Sample classwork</span></div>
        {records.length ? records.map(a => <article className="sa-row" key={a.id}><span className="sa-paper-symbol"><FileText size={23}/></span><div className="sa-row-copy"><div className="sa-row-title"><h2><Link to="/student/assignments/$assignmentId" params={{ assignmentId: String(a.id) }}>{a.title}</Link></h2><AssignmentStatus assignment={a}/></div><p><BookOpen size={14}/>{a.unitName}</p><div className="sa-row-meta"><span><ClipboardList size={14}/>{a.questionCount} questions</span><span><Clock3 size={14}/>{a.timeLimitMinutes} minutes</span></div></div><div className="sa-row-due"><span><CalendarDays size={14}/>{a.status === "SUBMITTED" ? "Deadline" : "Due date"}</span><strong>{a.dueLabel}</strong><small className={a.status === "TODO" && a.dueInDays <= 2 ? "sa-due-soon" : ""}>{a.status === "SUBMITTED" ? "Assignment submitted" : `Due in ${a.dueInDays} days`}</small></div><Button variant="outline" className="sa-row-action" asChild><Link to="/student/assignments/$assignmentId" params={{ assignmentId: String(a.id) }}>{a.status === "SUBMITTED" ? "View details" : "View assignment"}<ArrowRight size={16}/></Link></Button></article>) : <div className="sa-empty"><Search size={30}/><h2>No assignments found</h2><p>Try another title or unit.</p><Button variant="outline" onClick={() => { setQuery(""); setUnit("all"); setFilter("ALL"); }}>Clear filters</Button></div>}
      </TabsContent>
    </Tabs><p className="sa-sample-note"><ShieldCheck size={15}/>Sample assignments · Dates, teacher and progress are for preview only.</p>
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