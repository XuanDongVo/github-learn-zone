import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Đông Võ Xuân — Portfolio" },
      { name: "description", content: "Portfolio của Đông Võ Xuân: E-Learning cho học sinh THCS và Assignment Studio cho giáo viên." },
      { property: "og:title", content: "Đông Võ Xuân — Portfolio" },
      { property: "og:description", content: "Những sản phẩm học tập đang được xây dựng: E-Learning và Assignment Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

// Sample profile copy — replace with real details.
const PROFILE = {
  name: "Đông Võ Xuân",
  role: "Full-stack Developer",
  bio: "Xây dựng sản phẩm học tập giúp học sinh THCS tiến bộ môn tiếng Anh mỗi tuần.",
  photo: "" as string, // put real photo URL here
  github: "https://github.com/XuanDongVo",
  email: "",
  stack: ["Next.js", "React", "TypeScript", "Tailwind", "Spring Boot", "PostgreSQL"],
};

const PROJECTS = [
  {
    name: "E-Learning",
    status: "Đang xây dựng",
    progress: 65,
    text: "Nền tảng tiếng Anh lớp 6–8: Unit, Activity luyện tập, bài tập, mascot Pipo và gamification XP / streak / level.",
    tags: ["Student", "Gamification", "Practice"],
    url: "https://github.com/XuanDongVo/E-Learning",
  },
  {
    name: "Assignment Studio",
    status: "Beta",
    progress: 80,
    text: "Công cụ giáo viên soạn bài 5 dạng câu hỏi, giao bài cho lớp và phân tích kết quả, phổ điểm, từng lượt làm.",
    tags: ["Teacher", "Builder", "Analytics"],
    url: "https://github.com/XuanDongVo/assignment-studio",
  },
];

type Layer = { dy: number; a: number; k: number; v: number; ph: number; fill?: string; span?: [number, number] };
const LAYERS: Layer[] = [
  { dy: -100, a: 20, k: 1.5, v: 0.9, ph: 0, fill: "var(--band)" },
  { dy: -52, a: 23, k: 1.9, v: 1.15, ph: 1.7, fill: "var(--paper)" },
  { dy: 0, a: 25, k: 1.7, v: 1.3, ph: 3.1, fill: "var(--band2)" },
  { dy: 26, a: 18, k: 2.4, v: 1, ph: 4.4, span: [0.06, 0.44] },
  { dy: 48, a: 22, k: 1.45, v: 1.4, ph: 0.6, fill: "var(--paper)" },
  { dy: 76, a: 15, k: 2.1, v: 1.2, ph: 5.1, span: [0.52, 0.97] },
  { dy: 104, a: 24, k: 1.8, v: 1.25, ph: 2.2, fill: "var(--paper)" },
  { dy: 130, a: 14, k: 2.7, v: 1, ph: 1.1, span: [0, 0.62] },
];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
const io = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

function Portfolio() {
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, from: 0, to: 0, t0: 0 });
  const [scene, setScene] = useState(0);

  const go = (to: number) => {
    const s = st.current;
    if (s.to === to) return;
    s.from = s.p; s.to = to; s.t0 = performance.now();
    setScene(to);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0, lock = 0;
    const paths = svg.current ? Array.from(svg.current.querySelectorAll("path")) : [];
    const render = (now: number) => {
      const s = st.current;
      s.p = mix(s.from, s.to, io(seg(now, s.t0, s.t0 + (reduced ? 1 : 2100))));
      const p = s.p, t = reduced ? 0 : (now - start) / 1000;
      const W = frame.current?.clientWidth ?? 1, H = frame.current?.clientHeight ?? 1;
      const y0 = H * 0.86, y1 = H * 0.3;
      LAYERS.forEach((l, i) => {
        const base = mix(y0, y1, p) + l.dy * mix(1, 0.6, p);
        const a = l.a * mix(1, 0.72, p), f = ((2 * Math.PI) / 1100) * l.k * (1 - 0.35 * p);
        const y = (x: number) => base + a * Math.sin(f * x + t * l.v + l.ph) + a * 0.45 * Math.sin(f * 2.3 * x - t * l.v * 0.7 + l.ph * 1.7);
        const x0 = l.span ? W * l.span[0] : -20, x1 = l.span ? W * l.span[1] : W + 20;
        let d = `M${x0} ${y(x0)}`;
        for (let x = x0 + 22; x < x1; x += 22) d += `L${x} ${y(x)}`;
        d += `L${x1} ${y(x1)}`;
        if (l.fill) d += `L${x1} ${H + 40}L${x0} ${H + 40}Z`;
        paths[i]?.setAttribute("d", d);
      });
      if (s1.current) {
        s1.current.style.opacity = String(1 - seg(p, 0.3, 0.6));
        s1.current.style.transform = `translateY(${-p * 60}px)`;
        s1.current.style.pointerEvents = p > 0.1 ? "none" : "auto";
      }
      if (s2.current) {
        const k = seg(p, 0.45, 0.9);
        s2.current.style.opacity = String(k * k);
        s2.current.style.transform = `translateY(${mix(70, 0, k)}px)`;
        s2.current.style.pointerEvents = p > 0.9 ? "auto" : "none";
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const onWheel = (e: WheelEvent) => {
      if (Date.now() < lock) return;
      if (e.deltaY > 8) { go(1); lock = Date.now() + 1200; }
      else if (e.deltaY < -8 && (s2.current?.scrollTop ?? 0) <= 0) { go(0); lock = Date.now() + 1200; }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowDown") go(1); if (e.key === "ArrowUp" || e.key === "Escape") go(0); };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); };
  }, []);

  const initials = PROFILE.name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <div className="sw">
      <main className="frame" ref={frame}>
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[6%] pt-8 max-sm:pt-5">
          <button type="button" onClick={() => go(0)} className="serif text-2xl max-sm:text-lg">{PROFILE.name}</button>
          <nav className="small flex gap-8 max-sm:gap-4 max-sm:text-[10px]">
            <button type="button" onClick={() => go(0)} aria-current={scene === 0}>Về tôi</button>
            <button type="button" onClick={() => go(1)} aria-current={scene === 1}>Dự án</button>
            <a href={PROFILE.github} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </header>

        <div ref={s1} className="absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 pb-[18vh] text-center">
          <div className="avatar mb-7 h-[clamp(130px,20vw,210px)] w-[clamp(130px,20vw,210px)]">
            {PROFILE.photo ? (
              <img src={PROFILE.photo} alt={`Ảnh ${PROFILE.name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="serif flex h-full w-full items-center justify-center text-[clamp(44px,6vw,72px)]">{initials}</div>
            )}
          </div>
          <p className="eb">{PROFILE.role}</p>
          <h1 className="serif mt-4 text-[clamp(44px,7vw,88px)] leading-[.92]">Xin chào,<br />tôi là Đông</h1>
          <p className="small mt-5 max-w-xl">{PROFILE.bio}</p>
          <button type="button" className="pill mt-9" onClick={() => go(1)}>Xem dự án</button>
        </div>

        <svg ref={svg} className="waves pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible" aria-hidden>
          {LAYERS.map((l, i) => <path key={i} fill={l.fill ?? "none"} />)}
        </svg>

        <div ref={s2} className="absolute inset-0 z-[3] overflow-y-auto px-[6%] pb-16 pt-28 opacity-0 max-sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="eb">Công trình đang xây</p>
            <h2 className="serif mt-3 text-[clamp(38px,5.5vw,72px)] leading-[.98]">Xưởng của tôi</h2>
            <div className="mt-8 grid gap-7 md:grid-cols-2">
              {PROJECTS.map((pr) => (
                <article key={pr.name} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="serif text-4xl">{pr.name}</h3>
                    <span className="tag">{pr.status}</span>
                  </div>
                  <p className="small mt-4 flex-1 normal-case tracking-[.04em]">{pr.text}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{pr.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                  <div className="mt-5">
                    <div className="small mb-2 flex justify-between"><span>Tiến độ</span><span>{pr.progress}%</span></div>
                    <div className="bar" role="progressbar" aria-valuenow={pr.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pr.progress}%` }} /></div>
                  </div>
                  <a href={pr.url} target="_blank" rel="noreferrer" className="pill mt-6 self-start !px-7 !text-sm">Xem mã nguồn</a>
                </article>
              ))}
            </div>
            <section className="card mt-8 p-6">
              <p className="eb">Hành trang</p>
              <div className="mt-4 flex flex-wrap gap-2">{PROFILE.stack.map((s) => <span key={s} className="tag">{s}</span>)}</div>
              <p className="small mt-5">GitHub: <a className="underline" href={PROFILE.github} target="_blank" rel="noreferrer">XuanDongVo</a></p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
