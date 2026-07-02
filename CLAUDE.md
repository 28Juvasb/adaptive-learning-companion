# CLAUDE.md — Adaptive Learning Companion

Guidance for Claude Code (and any AI agent) working in this repository. Read this before editing.

## What this project is

A single-page React web app: an **AI tutor that diagnoses prerequisite gaps before teaching**, remediates them, teaches the target topic, then converts every mistake into spaced-repetition flashcards. Built for the Samsung Solve for Tomorrow hackathon. The **pedagogical 5-stage loop is the product**, not the chatbot UI.

The five stages, in order:

1. **Setup (Intake)** — student enters topic, level, optional pasted study material.
2. **Diagnose** — LLM generates 3–5 prerequisite questions (testing foundations, *not* the topic).
3. **Remediate** — LLM grades answers, identifies gaps, writes mini-lessons for weak prerequisites.
4. **Teach** — LLM delivers the lesson (grounded in pasted material if given) + comprehension check.
5. **Reinforce → Review** — mistakes become flashcards, reviewed on an SM-2-lite spaced-repetition schedule.

## Tech stack

- **React 18 + Vite 6** — SPA, no router (stage is held in reducer state).
- **Tailwind CSS 4** — via `@tailwindcss/vite` plugin (note: v4 uses `@import "tailwindcss"` in CSS, **no `tailwind.config.js` or PostCSS config needed**).
- **OpenRouter** free-tier models — OpenAI-compatible chat completions API.
- **localStorage** — the only persistence (flashcard deck under key `alc_flashcards`).
- **React `useReducer`** — the single 5-stage state machine. No Redux/Zustand.

## Architecture & where things live

```
src/
├── App.jsx                    # stage router + top-level state (useReducer + deck useState)
├── main.jsx                   # React entry point
├── index.css                  # Tailwind import + flashcard flip animation
├── state/
│   └── sessionReducer.js      # THE state machine — all stage transitions & session data
├── lib/
│   ├── openrouter.js          # LLM wrapper: fetch, JSON extraction, model failover, demo mode
│   ├── prompts.js             # all stage prompts + response VALIDATORS (one fn per stage)
│   ├── mocks.js               # canned topic-aware responses (demo mode / no API key)
│   ├── srs.js                 # SM-2-lite spaced repetition (pure, no LLM)
│   ├── storage.js             # localStorage deck load/save/add/update
│   └── useStageFetch.js       # hook: run-once-on-mount fetch with loading/error/retry
└── components/
    ├── ui.jsx                 # shared primitives (Card, buttons, Spinner, ErrorPanel, Badge…)
    ├── SetupStage.jsx
    ├── DiagnoseStage.jsx
    ├── RemediateStage.jsx
    ├── TeachStage.jsx
    ├── ReinforceStage.jsx
    └── ReviewStage.jsx
```

**Data flow per stage:** component mounts → `useStageFetch` calls a function from `prompts.js` → that function calls `callLLM` in `openrouter.js` → response is validated/normalized → `dispatch` writes it into reducer state → UI renders from state → user action dispatches `GO_TO_STAGE` to advance.

## Critical invariants — do not break these

1. **Every LLM response goes through a validator in `prompts.js`.** Free models return malformed or partial JSON regularly. Each stage function passes a `validate` callback to `callLLM` that normalizes fields and throws `LLMError` on missing data. Never consume raw LLM JSON directly in a component.

2. **`callLLM` handles JSON extraction and model failover — components never call `fetch`.** The wrapper strips markdown fences, extracts the `{...}` substring, and tries each model in `MODELS` in order. Add new stages by adding a function in `prompts.js`, not by calling the API elsewhere.

3. **Demo mode must keep working.** When `VITE_OPENROUTER_API_KEY` is empty, `isDemoMode` is true and `callLLM` returns canned responses from `mocks.js` instead of hitting the network. This is the demo safety net if the free tier rate-limits live. Every stage needs a matching `mockKey` entry in `mocks.js`. **When you add or change a stage's expected JSON shape, update its validator AND its mock together.**

4. **The reducer is the single source of truth for session state.** Stage components read from `state` and write via `dispatch`. The flashcard *deck* is the one exception: it lives in `App` `useState` + localStorage (it outlives a session), passed down as `deck` / `onDeckChange`.

5. **`useStageFetch` runs the fetch exactly once per mount** (guarded by a ref, so React 18 StrictMode double-invoke doesn't double-call the API). Pass `skip: true` when the data already exists in state so re-entering a stage doesn't refetch.

## Commands

```bash
npm install       # once
npm run dev       # dev server on http://localhost:5173
npm run build     # production build to dist/ (also the fastest way to catch errors)
npm run preview   # serve the production build
```

There is no test suite and no linter configured. **`npm run build` is the verification gate** — it must pass with no errors before claiming a change works. For behavioral verification, run the dev server and walk the loop (demo mode needs no key).

## Model configuration (the one-line demo swap)

In `src/lib/openrouter.js`, `MODELS` is an ordered array tried top-to-bottom on failure. If the primary rate-limits during a demo, move a different model to the front. This is the intended mid-demo escape hatch — keep it a single obvious edit.

## Conventions

- Plain `.jsx`, function components, hooks. No TypeScript.
- Tailwind utility classes inline; shared visual pieces go in `components/ui.jsx`.
- Dark theme throughout (`bg-slate-950` base, `indigo` accent).
- Keep prompts strict: every system prompt ends with the "return ONLY raw JSON" rule and an explicit shape. If you loosen a prompt, tighten the validator to compensate.
- Comments explain *why* (constraints, gotchas), not *what*.

## Gotchas learned building this

- **Tailwind v4 ≠ v3.** No config file, no `content` array, no `@tailwind base/components/utilities`. Just the Vite plugin + `@import "tailwindcss"`. Don't "fix" the missing config — it's correct.
- **Free models ignore `response_format` sometimes.** The fence-stripping + brace-extraction in `extractJSON` is required, not optional.
- **StrictMode double-mounts** in dev — that's why `useStageFetch` guards with a ref. Don't remove the guard.
- Editing `.env.local` requires a **dev server restart** — Vite only reads env vars at startup.
