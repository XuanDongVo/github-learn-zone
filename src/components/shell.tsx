import { Link } from "@tanstack/react-router";
import { GraduationCap, AlertCircle, RotateCw, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function StudentShell({ children }: { children: ReactNode }) {
  const nav = "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md";
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" /> E-Learning
          </Link>
          <nav className="flex gap-1">
            <Link to="/" className={nav} activeOptions={{ exact: true }} activeProps={{ className: "text-foreground bg-muted" }}>Home</Link>
            <Link to="/units" className={nav} activeProps={{ className: "text-foreground bg-muted" }}>Units</Link>
          </nav>
          <span className="ml-auto rounded-sm border border-warning/40 bg-warning-soft px-2 py-0.5 text-xs font-medium">Prototype · sample data</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}

export function Crumbs({ items }: { items: ReactNode[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">{i > 0 && <span>/</span>}{it}</span>
      ))}
    </nav>
  );
}

export const Skeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="surface h-20 animate-pulse bg-muted" />)}</div>
);

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-10 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="font-medium">We couldn't load this right now.</p>
      <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"><RotateCw className="h-4 w-4" />Try again</button>
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="surface flex flex-col items-center gap-2 p-10 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-md border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted";

export type DemoState = "data" | "loading" | "empty" | "error";
export function StateSwitch({ value, onChange }: { value: DemoState; onChange: (v: DemoState) => void }) {
  return (
    <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
      Preview state:
      {(["data", "loading", "empty", "error"] as DemoState[]).map((s) => (
        <button key={s} onClick={() => onChange(s)} className={`rounded-sm border px-2 py-0.5 ${value === s ? "border-primary bg-primary-soft text-primary" : "bg-card"}`}>{s}</button>
      ))}
    </div>
  );
}
