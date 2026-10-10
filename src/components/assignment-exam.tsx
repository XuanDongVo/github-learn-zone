import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronRight, ClipboardCheck, Clock3, Grid2X2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExamQuestionItem, EXAM_TYPE_LABEL } from "@/components/exam-question";
import { EXAM_QUESTIONS, EXAM_SAMPLE } from "@/lib/mock";
import { canEditExam, formatExamTime, unansweredIds, isExamAnswered, examAnswerSummary, type ExamAnswers } from "@/lib/exam";

export function AssignmentExam() {
  const [current, setCurrent] = useState(EXAM_SAMPLE.currentQuestion);
  const [answers, setAnswers] = useState<ExamAnswers>({ ...EXAM_SAMPLE.answers });
  const [seconds, setSeconds] = useState(EXAM_SAMPLE.remainingSeconds);
  const [view, setView] = useState<"exam" | "review" | "submitted">("exam");
  const [drawer, setDrawer] = useState(false);
  const [changed, setChanged] = useState(false);
  const deadline = useRef<number | null>(null);
  const pendingQuestion = useRef<number | null>(null);
  
  const submitted = view === "submitted";
  const editable = canEditExam(seconds, submitted);
  const ids = EXAM_QUESTIONS.map(q => q.id);
  const unanswered = unansweredIds(ids, answers);
  const answered = ids.length - unanswered.length;

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

  useEffect(() => {
    if (view !== "exam" || pendingQuestion.current === null) return;
    const id = pendingQuestion.current;
    pendingQuestion.current = null;
    const timer = window.setTimeout(() => {
      document.getElementById(`exam-question-${id}`)?.scrollIntoView({ behavior: "instant", block: "start" });
      document.getElementById(`exam-heading-${id}`)?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [view, current, drawer]);

  useEffect(() => {
    if (view !== "exam") return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const first = visible[0];
      if (first && !pendingQuestion.current) setCurrent(Number(first.target.getAttribute("data-question-id")));
    }, { rootMargin: "-180px 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("[data-question-id]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [view]);

  const scrollToQuestion = (id: number) => {
    pendingQuestion.current = id;
    setCurrent(id); setView("exam"); setDrawer(false);
    if (view === "exam" && current === id && !drawer) {
      pendingQuestion.current = null;
      document.getElementById(`exam-question-${id}`)?.scrollIntoView({ block: "start" });
      document.getElementById(`exam-heading-${id}`)?.focus({ preventScroll: true });
    }
  };
  const review = () => { setView("review"); setDrawer(false); window.scrollTo({ top: 0 }); };
  const handleAnswerChange = (questionId: number, answer: string[]) => {
    if (!editable) return;
    setAnswers(previous => ({ ...previous, [questionId]: answer })); setChanged(true);
  };

  const navigator = <>
    <div className="exam-nav-heading"><h2>Questions</h2><span>{answered} / {ids.length} answered</span></div>
    <div className="exam-nav-grid" aria-label="All questions">
      {ids.map(id => (
        <Button 
          key={id} 
          variant="outline" 
          className={`exam-number ${isExamAnswered(answers[id]) ? "is-answered" : ""} ${current === id && view === "exam" ? "is-current" : ""}`} 
          aria-label={`Question ${id}, ${isExamAnswered(answers[id]) ? "answered" : "unanswered"}`} 
          aria-current={current === id && view === "exam" ? "step" : undefined} 
          onClick={() => scrollToQuestion(id)}
        >
          {id}
          {isExamAnswered(answers[id]) && <span className="exam-answered-dot" aria-hidden="true"/>}
        </Button>
      ))}
    </div>
    <div className="exam-legend"><span><i className="legend-current"/>Current</span><span><i className="legend-answered"/>Answered</span><span><i/>Unanswered</span></div>
    <div className="exam-nav-divider"/>
    <div className="exam-summary-row"><span>Answered</span><strong>{answered}<span> / {ids.length}</span></strong></div>
    <progress className="exam-progress" max={ids.length} value={answered} aria-label="Questions answered"/>
    <p className="exam-unanswered-count">{unanswered.length} questions unanswered</p>
    <Button className="exam-review-button" onClick={review}><ClipboardCheck/>Review &amp; Submit<ArrowUpRight/></Button>
    <div className="exam-submit-note"><LockKeyhole size={13}/><span>Answers are final after submission.</span></div>
  </>;

  return <div className="exam-app">
    <header className="exam-brandbar"><Link to="/" className="exam-brand" aria-label="LearnUp home"><span className="exam-brand-mark"><BookOpen size={22}/></span>Learn<span>Up</span></Link><div className="exam-course"><span>{EXAM_SAMPLE.course}</span><span className="exam-avatar">S</span></div></header>
    <div className="exam-assignmentbar"><div className="exam-assignment-inner"><div><div className="exam-breadcrumb"><span>My assignments</span><ChevronRight size={12}/><span>Unit 3</span><span className="exam-mode">EXAM</span></div><h1>{EXAM_SAMPLE.title}</h1><p>{EXAM_SAMPLE.subtitle}<span>·</span>{ids.length} questions</p></div><div className="exam-header-status"><span className="exam-header-question">{submitted ? "Assignment submitted" : view === "review" ? "Review your answers" : `Question ${current} of ${ids.length}`}</span><div className={`exam-timer ${seconds <= 300 ? "time-low" : ""}`} role="timer" aria-label={`${formatExamTime(seconds)} remaining`}><Clock3 size={20}/><div><span>{submitted ? "TIME REMAINING AT SUBMISSION" : "TIME REMAINING"}</span><strong>{formatExamTime(seconds)}</strong></div></div></div></div></div>
    
    <div className="exam-workspace">
      <div className="exam-mobile-toolbar"><span>{view === "exam" ? `${answered} of ${ids.length} answered` : `Reviewing ${ids.length} questions`}</span>{!submitted && <Sheet open={drawer} onOpenChange={setDrawer}><SheetTrigger asChild><Button variant="outline"><Grid2X2/>Questions</Button></SheetTrigger><SheetContent className="exam-app exam-drawer"><SheetTitle className="sr-only">Question navigator</SheetTitle><SheetDescription className="sr-only">Answered and unanswered questions</SheetDescription>{navigator}</SheetContent></Sheet>}</div>
      
      <main className="exam-main">
        {submitted ? (
          <section className="exam-submitted" aria-live="polite">
            <div className="submission-symbol"><CheckCheck size={34}/></div>
            <span className="exam-kicker">SUBMISSION COMPLETE</span>
            <h2>Your assignment is submitted.</h2>
            <p>Your sample answers are now locked. No score or answer feedback is shown during this exam.</p>
            <div className="submission-stats"><div><strong>{answered}</strong><span>Answered</span></div><div><strong>{unanswered.length}</strong><span>Unanswered</span></div></div>
            <p className="exam-demo-note">Demo submission only · Not sent to your teacher</p>
            <Button asChild variant="outline"><Link to="/units"><ArrowLeft/>Back to my learning</Link></Button>
          </section>
        ) : view === "review" ? (
          <section className="exam-review">
            <div className="exam-kicker"><ClipboardCheck size={15}/>FINAL REVIEW</div>
            <h2>Ready to submit?</h2>
            <p className="exam-review-intro">Check your answers before you finish this assignment.</p>
            <div className="review-totals"><div><Check size={18}/><strong>{answered}</strong><span>Answered</span></div><div><span className="unanswered-ring"/><strong>{unanswered.length}</strong><span>Unanswered</span></div></div>
            {seconds === 0 ? (
              <div className="exam-review-notice" role="alert">Time is up. Your answers are locked. Submit the answers you have completed.</div>
            ) : unanswered.length > 0 ? (
              <div className="exam-review-notice">You have {unanswered.length} unanswered questions. You can return to them or submit as they are.</div>
            ) : null}
            <div className="review-question-list">
              {EXAM_QUESTIONS.map(q => (
                <Button variant="ghost" key={q.id} className="review-question-row" onClick={() => scrollToQuestion(q.id)}>
                  <span className={`review-question-number ${isExamAnswered(answers[q.id]) ? "has-answer" : ""}`}>{q.id}</span>
                  <span className="review-question-copy">
                    <strong>Question {q.id}</strong>
                    <span>{examAnswerSummary(q, answers[q.id])}</span>
                  </span>
                  <ChevronRight/>
                </Button>
              ))}
            </div>
            <div className="review-actions">
              <Button variant="outline" onClick={() => scrollToQuestion(current)}><ArrowLeft/>Return to exam</Button>
              <Button onClick={() => { setView("submitted"); setDrawer(false); window.scrollTo({ top: 0 }); }}><LockKeyhole/>Submit assignment</Button>
            </div>
            <p className="exam-submit-note">You cannot change your answers after submission.</p>
          </section>
        ) : (
          <div className="exam-question-scroll-list">
            {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "TYPE_ANSWER"].map((type, index) => {
              const questions = EXAM_QUESTIONS.filter(question => question.type === type);
              const first = questions[0];
              if (!first) return null;
              return <section className="exam-list-section" key={type} aria-labelledby={`part-${index}`}>
                <header className="exam-section-heading"><span className="exam-kicker">PART {String(index + 1).padStart(2, "0")}</span><h2 id={`part-${index}`}>{EXAM_TYPE_LABEL[first.type]}</h2><p>{first.prompt}</p><span className="exam-section-count">Questions {first.id}–{questions.at(-1)?.id}</span></header>
                <div className="exam-section-questions">{questions.map(q => <ExamQuestionItem key={q.id} question={q} answer={answers[q.id]} total={ids.length} editable={editable} current={current === q.id} onActivate={() => setCurrent(q.id)} onChange={answer => handleAnswerChange(q.id, answer)}/>)}</div>
              </section>;
            })}
            <div className="exam-list-end"><ShieldCheck size={17}/><span>End of assignment · {answered} of {ids.length} answered</span><Button onClick={review}><ClipboardCheck/>Review &amp; Submit</Button></div>
          </div>
        )}
      </main>
      {!submitted && <aside className="exam-navigator" aria-label="Question navigator">{navigator}</aside>}
    </div>
    {view === "exam" && <Button className="exam-mobile-submit" onClick={review}><ClipboardCheck/>Review &amp; Submit<ArrowUpRight/></Button>}
    <footer className="exam-footer"><span><LockKeyhole size={12}/>Assignment exam</span><span>Sample assignment · Not a live exam</span><span>LearnUp · A little better, every day.</span></footer>
  </div>;
}
