import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isExamAnswered, toggleExamOption, type ExamQuestion } from "@/lib/exam";
import type { QuestionType } from "@/lib/domain";

export const EXAM_TYPE_LABEL: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Single choice", MULTIPLE_CHOICE: "Multiple choice", TRUE_FALSE: "True / False",
  FILL_IN_BLANK: "Fill in the blank", TYPE_ANSWER: "Written answer",
};

export function ExamQuestionItem({ question, answer = [], total, editable, current, onChange, onActivate }: {
  question: ExamQuestion; answer?: string[]; total: number; editable: boolean; current: boolean;
  onChange: (answer: string[]) => void; onActivate: () => void;
}) {
  const textAnswer = question.type === "FILL_IN_BLANK" || question.type === "TYPE_ANSWER";
  return <article id={`exam-question-${question.id}`} data-question-id={question.id} className={`exam-list-question ${current ? "question-active" : ""}`} onFocusCapture={onActivate}>
    <div className="question-topline"><span className="exam-kicker">Question {question.id} / {total}</span><span>{EXAM_TYPE_LABEL[question.type]}</span></div>
    <h3 tabIndex={-1} id={`exam-heading-${question.id}`}>{question.sentence}</h3>
    <fieldset disabled={!editable} className="exam-list-fieldset"><legend className={textAnswer ? "sr-only" : "exam-list-instruction"}>{question.prompt}</legend>
    {question.options.length > 0 ? <div className={`exam-list-options ${question.type === "TRUE_FALSE" ? "true-false-options" : ""}`}>{question.options.map(option => <label key={option.key} className={`exam-list-option ${answer.includes(option.key) ? "answer-selected" : ""}`}>
      <input type={question.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={`question-${question.id}`} aria-label={`${option.key}. ${option.text}`} checked={answer.includes(option.key)} onChange={() => onChange(toggleExamOption(answer, option.key, question.type === "MULTIPLE_CHOICE"))}/>
      <span>{question.type !== "TRUE_FALSE" && <strong>{option.key}. </strong>}{option.text}</span>
    </label>)}</div> : question.type === "FILL_IN_BLANK" ? <div className="exam-text-answer"><label htmlFor={`answer-${question.id}`}>Your answer</label><Input id={`answer-${question.id}`} autoComplete="off" value={answer[0] ?? ""} placeholder="Type the missing word…" onChange={e => onChange([e.target.value])}/></div> : <div className="exam-text-answer"><label htmlFor={`answer-${question.id}`}>Your answer</label><Textarea id={`answer-${question.id}`} rows={3} value={answer[0] ?? ""} placeholder="Write your answer…" onChange={e => onChange([e.target.value])}/></div>}
    </fieldset>
    {isExamAnswered(answer) && <div className="exam-list-answer-status"><span><Check size={13}/>Answered</span>{editable && <Button variant="ghost" size="sm" onClick={() => onChange([])}>Clear answer</Button>}</div>}
  </article>;
}