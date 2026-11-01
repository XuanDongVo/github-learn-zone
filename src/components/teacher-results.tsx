import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronRight, Clock, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TEACHER_ASSIGNMENT_SAMPLE as A, TEACHER_ATTEMPTS, TEACHER_QUESTIONS, TEACHER_STUDENTS } from "@/lib/mock";
import {
  BUCKETS, STATUS_LABEL, STATUS_ORDER, bucketIndex, buildStudentRows, classStats, mean, median, needsAttention,
  questionStats, rowClassName, sectionStats, type AttentionItem, type PartStatus, type ProgressStatus, type QuestionStat,
  type StudentRow,
} from "@/lib/teacher-analytics";

type Tab = "overview" | "questions" | "sections" | "students" | "classes";
type StudentFilter = "ALL" | "LOW" | "NOT_STARTED" | "LATE";
type QuestionFilter = "ALL" | "HARD" | "NORMAL" | "TOO_EASY" | "UNANSWERED";

const STATUS_TONE: Record<ProgressStatus, string> = {
  SUBMITTED: "bg-success-soft text-success",
  LATE: "bg-warning-soft text-warning",
  TIMED_OUT: "bg-info-soft text-info",
  IN_PROGRESS: "bg-primary-soft text-primary",
  NOT_STARTED: "bg-muted text-muted-foreground",
  OVERDUE: "bg-destructive-soft text-destructive",
};
const STATUS_BAR: Record<ProgressStatus, string> = {
  SUBMITTED: "bg-success", LATE: "bg-warning", TIMED_OUT: "bg-info", IN_PROGRESS: "bg-primary", NOT_STARTED: "bg-muted-foreground/40", OVERDUE: "bg-destructive",
};
const PART_LABEL: Record<PartStatus, string> = { CORRECT: "Correct", PARTIAL: "Partially correct", INCORRECT: "Incorrect", UNANSWERED: "Unanswered" };
const PART_TONE: Record<PartStatus, string> = {
  CORRECT: "bg-success-soft text-success", PARTIAL: "bg-warning-soft text-warning", INCORRECT: "bg-destructive-soft text-destructive", UNANSWERED: "bg-muted text-muted-foreground",
};
const TYPE_LABEL = { SINGLE_CHOICE: "Single choice", MULTIPLE_CHOICE: "Multiple choice", TRUE_FALSE: "True / False", FILL_IN_BLANK: "Fill in blank", TYPE_ANSWER: "Type answer" } as const;
const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap", className)}>{children}</span>;
}
function StatusBadge({ status }: { status: ProgressStatus }) {
  return <Pill className={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}
function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-card", className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
      {children} <ArrowRight className="h-3 w-3" aria-hidden />
    </button>
  );
}
function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", className ?? "bg-primary")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
const scoreTone = (p: number) => (p < 65 ? "bg-warning" : "bg-primary");

export function TeacherResults() {
  const rows = useMemo(() => buildStudentRows(TEACHER_STUDENTS, TEACHER_ATTEMPTS, A.dueAt, A.now), []);
  const qs = useMemo(() => questionStats(TEACHER_QUESTIONS, TEACHER_ATTEMPTS), []);
  const sections = useMemo(() => sectionStats(TEACHER_ATTEMPTS), []);
  const classes = useMemo(() => classStats(rows), [rows]);
  const warnings = useMemo(() => needsAttention(rows, qs, sections), [rows, qs, sections]);

  const [tab, setTab] = useState<Tab>("overview");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("ALL");
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("ALL");
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [openStudent, setOpenStudent] = useState<StudentRow | null>(null);

  const scores = rows.filter((r) => r.score !== null).map((r) => r.score!);
  const completed = scores.length;
  const multiClass = classes.length > 1;

  const go = (t: AttentionItem["target"]) => {
    if (t.tab === "students") { setStudentFilter(t.filter); setTab("students"); }
    if (t.tab === "questions") { setTab("questions"); setOpenQuestion(t.position); }
    if (t.tab === "sections") { setTab("sections"); setSectionFilter(t.key); }
  };
  const openSection = (key: string) => { setSectionFilter(key); setQuestionFilter("ALL"); setTab("questions"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span>Teacher</span><ChevronRight className="h-3 w-3" aria-hidden />
          <span>Assignments</span><ChevronRight className="h-3 w-3" aria-hidden />
          <span className="truncate">{A.title}</span><ChevronRight className="h-3 w-3" aria-hidden />
          <span className="font-semibold text-foreground">Results</span>
        </nav>
        <header className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignment Results</p>
            <h1 className="truncate text-xl font-bold">{A.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{A.grade} · {A.classes.join(", ")}</span>
              <Pill className="bg-muted text-foreground">{A.status}</Pill>
              <span>Due {fmtDate(A.dueAt)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{A.timeLimitMinutes} min</span>
              <span>Updated {fmtDate(A.lastUpdated)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill className="bg-warning-soft text-warning">Sample data</Pill>
            <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5" aria-hidden />Refresh</Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            {(["overview", "questions", "sections", "students", "classes"] as Tab[]).map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-none border-b-2 border-transparent px-4 py-2.5 capitalize data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                ["Assigned", `${rows.length}`, "students"],
                ["Completed", `${completed} / ${rows.length}`, pct(completed / rows.length)],
                ["Average score", `${fmt(mean(scores))} / 10`, "completed only"],
                ["Median score", `${fmt(median(scores))} / 10`, "completed only"],
                ["Late", `${rows.filter((r) => r.status === "LATE").length}`, "students"],
                ["Not started", `${rows.filter((r) => r.status === "NOT_STARTED" || r.status === "OVERDUE").length}`, "students"],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-md border border-border bg-card px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Progress">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Student status distribution">
                  {STATUS_ORDER.map((s) => {
                    const c = rows.filter((r) => r.status === s).length;
                    return c ? <div key={s} className={STATUS_BAR[s]} style={{ width: `${(c / rows.length) * 100}%` }} title={`${STATUS_LABEL[s]}: ${c}`} /> : null;
                  })}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STATUS_ORDER.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm">
                      <span className={cn("h-2.5 w-2.5 rounded-sm", STATUS_BAR[s])} aria-hidden />
                      <span className="text-muted-foreground">{STATUS_LABEL[s]}</span>
                      <span className="ml-auto font-semibold tabular-nums">{rows.filter((r) => r.status === s).length}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Score distribution (out of 10)">
                <ScoreBars scores={scores} />
              </Panel>
            </div>

            <Panel title="Needs attention">
              {warnings.length === 0 ? <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p> : (
                <ul className="divide-y divide-border">
                  {warnings.map((w) => (
                    <li key={w.id} className="flex items-center gap-3 py-2.5">
                      <AlertTriangle className={cn("h-4 w-4 shrink-0", w.severity === "high" ? "text-warning" : "text-muted-foreground")} aria-hidden />
                      <span className="flex-1 text-sm">{w.text}</span>
                      <LinkButton onClick={() => go(w.target)}>{w.action}</LinkButton>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Section performance">
                <ul className="space-y-3">
                  {sections.map((s) => (
                    <li key={s.key}>
                      <button type="button" onClick={() => openSection(s.key)} className="w-full text-left">
                        <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.title}</span><span className="tabular-nums">{s.scorePct}%</span></div>
                        <Bar value={s.scorePct} className={scoreTone(s.scorePct)} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Questions to review" action={<LinkButton onClick={() => setTab("questions")}>View all questions</LinkButton>}>
                <ul className="divide-y divide-border">
                  {[...qs].sort((a, b) => a.correctRate - b.correctRate).slice(0, 4).map((q) => (
                    <li key={q.question.position}>
                      <button type="button" onClick={() => setOpenQuestion(q.question.position)} className="flex w-full items-center gap-3 py-2 text-left text-sm hover:bg-muted/50">
                        <span className="w-8 font-semibold text-muted-foreground">Q{q.question.position}</span>
                        <span className="flex-1 truncate">{q.question.summary}</span>
                        <span className="font-semibold tabular-nums">{pct(q.correctRate)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Students to review" action={<LinkButton onClick={() => { setStudentFilter("LOW"); setTab("students"); }}>View all students</LinkButton>}>
                <ul className="divide-y divide-border">
                  {rows.filter((r) => r.score !== null).sort((a, b) => a.score! - b.score!).slice(0, 4).map((r) => (
                    <li key={r.student.id}>
                      <button type="button" onClick={() => setOpenStudent(r)} className="flex w-full items-center gap-3 py-2 text-left text-sm hover:bg-muted/50">
                        <span className="flex-1 truncate font-medium">{r.student.name}</span>
                        <span className="font-semibold tabular-nums">{fmt(r.score)}</span>
                        <StatusBadge status={r.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </TabsContent>

          {/* QUESTIONS */}
          <TabsContent value="questions" className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "HARD", "NORMAL", "TOO_EASY", "UNANSWERED"] as QuestionFilter[]).map((f) => (
                <FilterChip key={f} active={questionFilter === f} onClick={() => setQuestionFilter(f)}>
                  {{ ALL: "All", HARD: "Hard", NORMAL: "Normal", TOO_EASY: "Too easy", UNANSWERED: "Unanswered-heavy" }[f]}
                </FilterChip>
              ))}
              {sectionFilter && (
                <FilterChip active onClick={() => setSectionFilter(null)}>
                  Section: {sections.find((s) => s.key === sectionFilter)?.title} ✕
                </FilterChip>
              )}
            </div>
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead><TableHead>Question</TableHead><TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Section</TableHead><TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">Correct</TableHead><TableHead className="hidden text-right lg:table-cell">Partial</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Incorrect</TableHead><TableHead className="hidden text-right md:table-cell">Unanswered</TableHead>
                    <TableHead>Difficulty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qs.filter((q) => (!sectionFilter || q.question.sectionKey === sectionFilter) && (
                    questionFilter === "ALL" || (questionFilter === "UNANSWERED" ? q.n > 0 && q.unanswered / q.n >= 0.1 : q.difficulty === questionFilter)
                  )).map((q) => (
                    <TableRow key={q.question.position} className="cursor-pointer" onClick={() => setOpenQuestion(q.question.position)}>
                      <TableCell className="font-semibold">Q{q.question.position}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{q.question.summary}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{TYPE_LABEL[q.question.type]}</TableCell>
                      <TableCell className="hidden sm:table-cell">{q.question.sectionTitle}</TableCell>
                      <TableCell className="text-right tabular-nums">{q.question.points} pt</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{pct(q.correctRate)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">{q.n ? pct(q.partial / q.n) : "—"}</TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">{q.n ? pct(q.incorrect / q.n) : "—"}</TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">{q.n ? pct(q.unanswered / q.n) : "—"}</TableCell>
                      <TableCell><DifficultyBadge q={q} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">Example questions are excluded. Unanswered responses count toward each question's total. In-progress attempts are excluded.</p>
          </TabsContent>

          {/* SECTIONS */}
          <TabsContent value="sections" className="mt-5">
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead><TableHead className="w-[38%]">Average score</TableHead><TableHead className="text-right">Correct</TableHead>
                    <TableHead className="text-right">Unanswered</TableHead><TableHead className="hidden text-right sm:table-cell">Students</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((s) => (
                    <TableRow key={s.key} className={cn("cursor-pointer", sectionFilter === s.key && "bg-primary-soft")} onClick={() => openSection(s.key)}>
                      <TableCell className="font-semibold">{s.title}<span className="ml-1 text-xs font-normal text-muted-foreground">· {s.questionCount} questions</span></TableCell>
                      <TableCell><div className="flex items-center gap-3"><Bar value={s.scorePct} className={scoreTone(s.scorePct)} /><span className="w-10 text-right tabular-nums">{s.scorePct}%</span></div></TableCell>
                      <TableCell className="text-right tabular-nums">{s.correctPct}%</TableCell>
                      <TableCell className="text-right tabular-nums">{s.unansweredPct}%</TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">{s.students}</TableCell>
                      <TableCell className="text-right"><span className="text-xs font-semibold text-primary">Questions →</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* STUDENTS */}
          <TabsContent value="students" className="mt-5">
            <StudentsTable rows={rows} filter={studentFilter} setFilter={setStudentFilter} multiClass={multiClass} onOpen={setOpenStudent} />
          </TabsContent>

          {/* CLASSES */}
          <TabsContent value="classes" className="mt-5">
            {!multiClass ? <p className="text-sm text-muted-foreground">This assignment targets a single class, so there is nothing to compare.</p> : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-md border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead><TableHead className="text-right">Students</TableHead><TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Avg score</TableHead><TableHead className="text-right">Median</TableHead><TableHead className="text-right">Late</TableHead>
                        <TableHead className="hidden md:table-cell">Distribution (0–4 · 4–6 · 6–8 · 8–10)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((c) => (
                        <TableRow key={c.classId}>
                          <TableCell className="font-semibold">{c.className}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.students}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.completed} <span className="text-muted-foreground">({pct(c.completed / c.students)})</span></TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{fmt(c.average)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(c.median)}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.late}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex h-2.5 w-48 overflow-hidden rounded-full bg-muted">
                              {c.buckets.map((b, i) => b ? <div key={i} style={{ width: `${(b / c.completed) * 100}%` }} className={["bg-destructive", "bg-warning", "bg-info", "bg-success"][i]} title={`${BUCKETS[i]}: ${b}`} /> : null)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">Classes use the class each student was in when they started. Differences describe results only and do not explain causes.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <QuestionSheet stat={qs.find((q) => q.question.position === openQuestion) ?? null} onClose={() => setOpenQuestion(null)} />
      <AttemptSheet row={openStudent} onClose={() => setOpenStudent(null)} />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold", active ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function DifficultyBadge({ q }: { q: QuestionStat }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Pill className={q.difficulty === "HARD" ? "bg-warning-soft text-warning" : q.difficulty === "TOO_EASY" ? "bg-info-soft text-info" : "bg-muted text-muted-foreground"}>
        {{ HARD: "Hard", NORMAL: "Normal", TOO_EASY: "Too easy" }[q.difficulty]}
      </Pill>
      {q.lowConfidence && <span className="text-xs text-muted-foreground">Low confidence</span>}
    </span>
  );
}

function ScoreBars({ scores }: { scores: number[] }) {
  const counts = [0, 0, 0, 0];
  scores.forEach((s) => (counts[bucketIndex(s)]! += 1));
  const max = Math.max(1, ...counts);
  return (
    <div className="flex h-44 items-end gap-4">
      {counts.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-semibold tabular-nums">{c} <span className="font-normal text-muted-foreground">({scores.length ? pct(c / scores.length) : "0%"})</span></span>
          <div className="w-full max-w-16 rounded-t bg-primary/80" style={{ height: `${(c / max) * 110}px` }} />
          <span className="text-xs text-muted-foreground">{BUCKETS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StudentsTable({ rows, filter, setFilter, multiClass, onOpen }: {
  rows: StudentRow[]; filter: StudentFilter; setFilter: (f: StudentFilter) => void; multiClass: boolean; onOpen: (r: StudentRow) => void;
}) {
  const [query, setQuery] = useState("");
  const list = rows
    .filter((r) => filter === "ALL" || (filter === "LOW" ? r.score !== null && r.score < 5 : filter === "LATE" ? r.status === "LATE" : r.status === "NOT_STARTED" || r.status === "OVERDUE"))
    .filter((r) => r.student.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (a.score ?? 99) - (b.score ?? 99));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "LOW", "LATE", "NOT_STARTED"] as StudentFilter[]).map((f) => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {{ ALL: "All students", LOW: "Below 5", LATE: "Late", NOT_STARTED: "Not started / overdue" }[f]}
          </FilterChip>
        ))}
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student" aria-label="Search student" className="ml-auto h-8 w-full sm:w-56" />
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Class at start</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead><TableHead className="hidden text-right md:table-cell">%</TableHead>
              <TableHead className="hidden text-right md:table-cell">Duration</TableHead><TableHead className="hidden text-right lg:table-cell">Unanswered</TableHead>
              {multiClass && <TableHead className="hidden text-right lg:table-cell">vs class average</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.student.id} className={cn(r.attempt && "cursor-pointer")} onClick={() => r.attempt && onOpen(r)}>
                <TableCell className="font-medium">{r.student.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{rowClassName(r)}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmt(r.score)}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{r.percentage === null ? "—" : `${r.percentage}%`}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{r.durationMinutes === null ? "—" : `${r.durationMinutes} min`}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{r.unanswered ?? "—"}</TableCell>
                {multiClass && (
                  <TableCell className={cn("hidden text-right tabular-nums lg:table-cell", r.vsClass !== null && r.vsClass < 0 ? "text-warning" : "text-muted-foreground")}>
                    {r.vsClass === null ? "—" : `${r.vsClass > 0 ? "+" : ""}${r.vsClass.toFixed(1)}`}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {list.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No students match this filter.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function QuestionSheet({ stat, onClose }: { stat: QuestionStat | null; onClose: () => void }) {
  return (
    <Sheet open={!!stat} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {stat && (
          <>
            <SheetHeader>
              <SheetTitle>Q{stat.question.position} · {stat.question.summary}</SheetTitle>
              <SheetDescription>{stat.question.sectionTitle} · {TYPE_LABEL[stat.question.type]} · {stat.question.points} pt · {stat.n} completed attempts</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">{stat.question.prompt}</p>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Correctness</h3>
                {(["CORRECT", "PARTIAL", "INCORRECT", "UNANSWERED"] as PartStatus[]).map((s) => {
                  const c = { CORRECT: stat.correct, PARTIAL: stat.partial, INCORRECT: stat.incorrect, UNANSWERED: stat.unanswered }[s];
                  return (
                    <div key={s} className="mb-2 flex items-center gap-3 text-sm">
                      <span className="w-32 text-muted-foreground">{PART_LABEL[s]}</span>
                      <Bar value={stat.n ? (c / stat.n) * 100 : 0} className={s === "CORRECT" ? "bg-success" : s === "INCORRECT" ? "bg-destructive/70" : s === "PARTIAL" ? "bg-warning" : "bg-muted-foreground/40"} />
                      <span className="w-6 text-right tabular-nums">{c}</span>
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Answer distribution</h3>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {stat.question.options
                    ? stat.question.options.map((o) => (
                        <li key={o.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="w-5 font-semibold">{o.key}</span><span className="flex-1">{o.text}</span>
                          {stat.question.correct.includes(o.key) && <Pill className="bg-success-soft text-success">Correct</Pill>}
                          <span className="w-6 text-right font-semibold tabular-nums">{stat.answerCounts.get(o.key) ?? 0}</span>
                        </li>
                      ))
                    : [...stat.answerCounts.entries()].sort((a, b) => b[1] - a[1]).map(([text, c]) => (
                        <li key={text} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <span className="flex-1">"{text}"</span><span className="w-6 text-right font-semibold tabular-nums">{c}</span>
                        </li>
                      ))}
                </ul>
                {!stat.question.options && <p className="mt-2 text-xs text-muted-foreground">Text answers are grouped ignoring case and extra spaces. Expected: {stat.question.correct.join(" / ")}</p>}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AttemptSheet({ row, onClose }: { row: StudentRow | null; onClose: () => void }) {
  const a = row?.attempt;
  const sections = a ? [...new Set(a.questions.filter((q) => !q.example).map((q) => q.sectionKey))] : [];
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {row && a && (
          <>
            <SheetHeader>
              <SheetTitle>{row.student.name}</SheetTitle>
              <SheetDescription>{A.title} · Read-only attempt as taken</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <dl className="mb-5 grid grid-cols-2 gap-3 rounded-md border border-border p-3 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Class at start</dt><dd className="font-semibold">{a.classNameAtStart}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge status={row.status} /></dd></div>
                <div><dt className="text-xs text-muted-foreground">Score</dt><dd className="font-semibold">{row.score === null ? "—" : `${fmt(row.score)} / 10`}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Duration</dt><dd className="font-semibold">{row.durationMinutes === null ? "—" : `${row.durationMinutes} min`}</dd></div>
              </dl>
              {a.status === "IN_PROGRESS" ? <p className="text-sm text-muted-foreground">This attempt is still in progress. Results appear after it is submitted or times out.</p> : sections.map((key) => {
                const items = a.questions.filter((q) => !q.example && q.sectionKey === key);
                const earned = items.reduce((s, q) => s + q.earnedPoints, 0);
                const possible = items.reduce((s, q) => s + q.possiblePoints, 0);
                return (
                  <section key={key} className="mb-5">
                    <header className="mb-2 flex items-center justify-between border-b border-border pb-1.5">
                      <h3 className="text-sm font-bold">{items[0]?.sectionTitle}</h3>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">{earned} / {possible} pts</span>
                    </header>
                    <ol className="space-y-2">
                      {items.map((r) => {
                        const q = TEACHER_QUESTIONS.find((x) => x.position === r.position)!;
                        const label = (keys: string[]) => keys.map((k) => q.options?.find((o) => o.key === k)?.text ?? k).join(", ");
                        return (
                          <li key={r.position} className="rounded-md border border-border p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <p><span className="mr-1 font-semibold text-muted-foreground">Q{r.position}.</span>{q.prompt}</p>
                              <Pill className={PART_TONE[r.status]}>{PART_LABEL[r.status]}</Pill>
                            </div>
                            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-[1fr_1fr_auto]">
                              <p><span className="text-muted-foreground">Student answer: </span><span className="font-medium">{r.answer.length ? label(r.answer) : "—"}</span></p>
                              {r.status !== "CORRECT" && <p><span className="text-muted-foreground">Correct answer: </span><span className="font-medium">{label(q.correct)}</span></p>}
                              <p className="font-semibold tabular-nums sm:col-start-3">{r.earnedPoints} / {r.possiblePoints} pts</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
              <p className="text-xs text-muted-foreground">Questions are shown as they existed when the student started. Grading is final and cannot be edited here.</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

