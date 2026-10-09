import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, Repeat } from "lucide-react";
import { StudentShell, btnPrimary } from "@/components/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Home — E-Learning" },
      { name: "description", content: "Start learning: browse your Units and practise Activities." },
      { property: "og:title", content: "Student Home — E-Learning" },
      { property: "og:description", content: "Browse Units and practise repeatable Activities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <StudentShell>
      <section className="surface p-8 sm:p-12">
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Pick a Unit and practise at your own pace.</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">Activities are practice — play them as many times as you like. They don't count as assignments.</p>
        <Link to="/units" className={`${btnPrimary} mt-8`}>Browse Units <ArrowRight className="h-4 w-4" /></Link>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="surface flex gap-3 p-5"><Layers className="h-5 w-5 text-primary" /><div><p className="font-semibold">Units of your grade</p><p className="text-sm text-muted-foreground">Each Unit groups its own Activities.</p></div></div>
        <div className="surface flex gap-3 p-5"><Repeat className="h-5 w-5 text-learning" /><div><p className="font-semibold">Learning or Try Hard</p><p className="text-sm text-muted-foreground">Practise with hints, or race the clock.</p></div></div>
      </div>
    </StudentShell>
  );
}
