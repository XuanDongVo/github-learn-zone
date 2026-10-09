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
