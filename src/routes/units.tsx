import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { StudentShell, Skeleton, ErrorState, EmptyState, StateSwitch, type DemoState } from "@/components/shell";
import { UNITS } from "@/lib/mock";

export const Route = createFileRoute("/units")({
  head: () => ({
    meta: [
      { title: "Units — E-Learning" },
      { name: "description", content: "Browse the published Units for your grade." },
      { property: "og:title", content: "Units — E-Learning" },
      { property: "og:description", content: "Browse the published Units for your grade." },
    ],
  }),
  component: Units,
});

function useDemo() {
  const [state, setState] = useState<DemoState>("loading");
  useEffect(() => { const t = setTimeout(() => setState("data"), 500); return () => clearTimeout(t); }, []);
  return [state, setState] as const;
}
export { useDemo };

function Units() {
  const [state, setState] = useDemo();
  return (
    <StudentShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Units</h1>
      <p className="mt-1 mb-4 text-muted-foreground">Grade 6 · choose a Unit to see its Activities.</p>
      <StateSwitch value={state} onChange={setState} />
      {state === "loading" && <Skeleton />}
      {state === "error" && <ErrorState onRetry={() => setState("data")} />}
      {state === "empty" && <EmptyState title="No Units yet" text="Your teacher hasn't published any Units for your grade." />}
      {state === "data" && (
        <ul className="surface divide-y">
          {UNITS.map((u) => (
            <li key={u.id}>
              <Link to="/activities" search={{ unitId: u.id }} className="flex items-center gap-4 p-5 hover:bg-muted/60">
                <span className="w-10 font-display text-sm font-semibold text-primary">{u.code}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{u.name}</span>
                  {u.description && <span className="block text-sm text-muted-foreground">{u.description}</span>}
                </span>
                <span className="hidden text-sm font-medium text-primary sm:inline">View activities</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StudentShell>
  );
}
