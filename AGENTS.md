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

- Review parsing (PDF/DOCX → text → reviews) runs client-side in src/lib/sentiment/parse.ts; classification goes through the `analyzeReviews` server function, which uses an optional OpenAI-compatible LLM via SENTIMENT_LLM_* env vars and otherwise the local lexicon engine. Why: no keys in the browser, always works without config.
- Analyses are session-only (React state, no database). Why: MVP works with zero backend setup.
- tsconfig has noUncheckedIndexedAccess and exactOptionalPropertyTypes disabled. Why: keeps parsing/analytics code readable.
