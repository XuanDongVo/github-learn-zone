<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep prototype sample records isolated in src/lib/mock.ts; UI components must not imply that samples are live API data.
- Use shared StudentShell and UnitGallery for the student pages so navigation and unit presentation stay consistent.
- Keep activity introduction and practice within a modal on the selected Unit Activities page to preserve unit context.
- Keep assignment exam presentation separate from Activity practice, with sample questions in mock.ts and pure exam-state helpers in a dedicated module; this prevents practice rules from leaking into assessment screens.
- Render exam questions through a shared typed answer component and store answers as string arrays; this supports all five existing QuestionType values without changing backend contracts.
- The home route presents the assignment exam sample while existing unit routes remain intact; this makes the requested exam the first preview without redefining backend contracts.
- Student Home lives at /student and uses the shared StudentShell; the root exam URL stays intact to preserve existing assessment links.
- Scope LearnUp student tokens to .learnup-theme and keep assessment tokens separate, so rewards and mascot styling never leak into exam mode.
- Presentation-only types live in src/mocks/types.ts, sample values stay in src/lib/mock.ts, and pure student rules live in src/lib/student.ts; none imply new backend contracts.
- Pipo state is shared through a provider in StudentShell and its SVG layers use semantic tokens, allowing accessible independent moods without external rendering dependencies.
- Student Assignment list and introduction use presentation-only samples and a dedicated detail route; the exam player stays untouched and only an explicitly linked sample opens the existing paper.
