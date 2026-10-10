import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronRight, ClipboardCheck, Clock3, Grid2X2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EXAM_QUESTIONS, EXAM_SAMPLE } from "@/lib/mock";
import { canEditExam, formatExamTime, unansweredIds, type ExamAnswers } from "@/lib/exam";

export function AssignmentExam() {
  const [current, setCurrent] = useState(EXAM_SAMPLE.currentQuestion);
  const [answers, setAnswers] = useState<ExamAnswers>({ ...EXAM_SAMPLE.answers });
  const [seconds, setSeconds] = useState(EXAM_SAMPLE.remainingSeconds);
  const [view, setView] = useState<"exam" | "review" | "submitted">("exam");
  const [drawer, setDrawer] = useState(false);
  const [changed, setChanged] = useState(false);
  const deadline = useRef<number | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const submitted = view === "submitted";
  const editable = canEditExam(seconds, submitted);
  const ids = EXAM_QUESTIONS.map(q => q.id);
  const unanswered = unansweredIds(ids, answers);
  const answered = ids.length - unanswered.length;
  const question = EXAM_QUESTIONS.find(q => q.id === current) ?? EXAM_QUESTIONS[0];

  useEffect(() => {
    if (submitted) return;
    deadline.current ??= Date.now() + EXAM_SAMPLE.remainingSeconds * 1000;
    const interval = window.setInterval(() => {
      const left = Math.max(0, Math.ceil(((deadline.current ?? Date.now()) - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) { setView("review"); window.clearInterval(interval); }
    }, 500);
    return () => window.clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    if (!changed || submitted) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed, submitted]);

  const goTo = (id: number) => {
    setCurrent(id); setView("exam"); setDrawer(false);
    window.setTimeout(() => questionHeading.current?.focus(), 0);
  };

  const navigator = <>
    <div className="exam-nav-heading"><h2>Questions</h2><span>{answered} / 20 answered</span></div>
    <div className="exam-nav-grid" aria-label="All questions">{ids.map(id => <Button key={id} variant="outline" className={`exam-number ${answers[id] ? "is-answered" : ""} ${current === id && view === "exam" ? "is-current" : ""}`} aria-label={`Question ${id}, ${answers[id] ? "answered" : "unanswered"}`} aria-current={current === id && view === "exam" ? "step" : undefined} onClick={() => goTo(id)}>{id}{answers[id] && <span className="exam-answered-dot" aria-hidden="true"/>}</Button>)}</div>
    <div className="exam-legend"><span><i className="legend-current"/>Current</span><span><i className="legend-answered"/>Answered</span><span><i/>Unanswered</span></div>
    <div className="exam-nav-divider"/>
    <div className="exam-summary-row"><span>Answered</span><strong>{answered}<span> / 20</span></strong></div>
    <progress className="exam-progress" max={20} value={answered} aria-label="Questions answered"/>
    <p className="exam-unanswered-count">{unanswered.length} questions unanswered</p>
    <Button className="exam-review-button" onClick={() => { setView("review"); setDrawer(false); }}><ClipboardCheck/>Review &amp; Submit<ArrowUpRight/></Button>
    <div className="exam-submit-note"><LockKeyhole size={13}/><span>Answers are final after submission.</span></div>
  </>;

  return <div className="exam-app">
    <header className="exam-brandbar"><Link to="/" className="exam-brand" aria-label="LearnUp home"><span className="exam-brand-mark"><BookOpen size={22}/></span>Learn<span>Up</span></Link><div className="exam-course"><span>{EXAM_SAMPLE.course}</span><span className="exam-avatar">S</span></div></header>
    <div className="exam-assignmentbar"><div className="exam-assignment-inner"><div><div className="exam-breadcrumb"><span>My assignments</span><ChevronRight size={12}/><span>Unit 3</span><span className="exam-mode">EXAM</span></div><h1>{EXAM_SAMPLE.title}</h1><p>{EXAM_SAMPLE.subtitle}<span>·</span>20 questions</p></div><div className="exam-header-status"><span className="exam-header-question">{submitted ? "Assignment submitted" : view === "review" ? "Review your answers" : `Question ${current} of 20`}</span><div className={`exam-timer ${seconds <= 300 ? "time-low" : ""}`} role="timer" aria-label={`${formatExamTime(seconds)} remaining`}><Clock3 size={20}/><div><span>{submitted ? "TIME REMAINING AT SUBMISSION" : "TIME REMAINING"}</span><strong>{formatExamTime(seconds)}</strong></div></div></div></div></div>
    <div className="exam-workspace">
      <div className="exam-mobile-toolbar"><span>{view === "exam" ? `Question ${current} of 20` : `${answered} of 20 answered`}</span>{!submitted && <Sheet open={drawer} onOpenChange={setDrawer}><SheetTrigger asChild><Button variant="outline"><Grid2X2/>Questions</Button></SheetTrigger><SheetContent className="exam-app exam-drawer"><SheetTitle className="sr-only">Question navigator</SheetTitle><SheetDescription className="sr-only">Answered and unanswered questions</SheetDescription>{navigator}</SheetContent></Sheet>}</div>
      <main className="exam-main">
      {submitted ? <section className="exam-submitted" aria-live="polite"><div className="submission-symbol"><CheckCheck size={34}/></div><span className="exam-kicker">SUBMISSION COMPLETE</span><h2>Your assignment is submitted.</h2><p>Your sample answers are now locked. No score or answer feedback is shown during this exam.</p><div className="submission-stats"><div><strong>{answered}</strong><span>Answered</span></div><div><strong>{unanswered.length}</strong><span>Unanswered</span></div></div><p className="exam-demo-note">Demo submission only · Not sent to your teacher</p><Button asChild variant="outline"><Link to="/units"><ArrowLeft/>Back to my learning</Link></Button></section>
      : view === "review" ? <section className="exam-review"><div className="exam-kicker"><ClipboardCheck size={15}/>FINAL REVIEW</div><h2>Ready to submit?</h2><p className="exam-review-intro">Check your answers before you finish this assignment.</p><div className="review-totals"><div><Check size={18}/><strong>{answered}</strong><span>Answered</span></div><div><span className="unanswered-ring"/><strong>{unanswered.length}</strong><span>Unanswered</span></div></div>{seconds === 0 ? <div className="exam-review-notice" role="alert">Time is up. Your answers are locked. Submit the answers you have completed.</div> : unanswered.length > 0 ? <div className="exam-review-notice">You have {unanswered.length} unanswered questions. You can return to them or submit as they are.</div> : null}<div className="review-question-list">{EXAM_QUESTIONS.map(q => <Button variant="ghost" key={q.id} className="review-question-row" onClick={() => goTo(q.id)}><span className={`review-question-number ${answers[q.id] ? "has-answer" : ""}`}>{q.id}</span><span className="review-question-copy"><strong>Question {q.id}</strong><span>{answers[q.id] ? `Selected answer: ${answers[q.id]} · ${q.options.find(o => o.key === answers[q.id])?.text}` : "No answer selected"}</span></span><ChevronRight/></Button>)}</div><div className="review-actions"><Button variant="outline" onClick={() => goTo(current)}><ArrowLeft/>Return to exam</Button><Button onClick={() => { setView("submitted"); setDrawer(false); }}><LockKeyhole/>Submit assignment</Button></div><p className="exam-submit-note">You cannot change your answers after submission.</p></section>
      : question ? <section className="exam-question"><div className="question-topline"><span className="exam-kicker">QUESTION {current}</span><span>Single choice</span></div><h2 ref={questionHeading} tabIndex={-1}>{question.prompt}</h2><div className="exam-sentence">{question.sentence.split("_____").map((part, i) => <span key={i}>{i > 0 && <span className="sentence-blank" aria-label="blank"/>}{part}</span>)}</div><fieldset className="exam-answer-list" disabled={!editable}><legend>Select one answer.</legend>{question.options.map(option => <label key={option.key} className={`exam-answer ${answers[current] === option.key ? "answer-selected" : ""}`}><input type="radio" name={`question-${current}`} value={option.key} checked={answers[current] === option.key} onChange={() => { if (!editable) return; setAnswers(a => ({ ...a, [current]: option.key })); setChanged(true); }}/><span className="exam-option-key">{option.key}</span><span className="exam-option-text">{option.text}</span><span className="exam-radio-indicator">{answers[current] === option.key && <span/>}</span></label>)}</fieldset><div className="exam-answer-footer"><span aria-live="polite">{!editable ? <><LockKeyhole size={14}/>Time is up. Answers are locked.</> : answers[current] ? <><Check size={15}/>Answer selected</> : "No answer selected"}</span>{answers[current] && editable && <Button variant="ghost" size="sm" onClick={() => { setAnswers(a => { const copy = { ...a }; delete copy[current]; return copy; }); setChanged(true); }}>Clear answer</Button>}</div></section> : null}
      <div className="exam-bottom-note"><ShieldCheck size={15}/><span>{submitted ? "Your submission is complete." : "Take your time. You can revisit any question before submitting."}</span></div>
      </main>
      {!submitted && <aside className="exam-navigator" aria-label="Question navigator">{navigator}</aside>}
    </div>
    {view === "exam" && <Button className="exam-mobile-submit" onClick={() => setView("review")}><ClipboardCheck/>Review &amp; Submit<ArrowUpRight/></Button>}
    <footer className="exam-footer"><span><LockKeyhole size={12}/>Assignment exam</span><span>Sample assignment · Not a live exam</span><span>LearnUp · A little better, every day.</span></footer>
  </div>;
}