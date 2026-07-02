# design.md — Visual & Interaction Design

This documents the actual design system implemented in the app — every value here is pulled from [`src/components/ui.jsx`](src/components/ui.jsx), [`src/index.css`](src/index.css), and [`src/App.jsx`](src/App.jsx), not aspirational. If you change a value in code, update it here too.

---

## 1. Design philosophy

- **Dark by default, no light mode.** The whole app assumes a dark background (`bg-slate-950`). This isn't a theme toggle — it's a fixed choice, matching the "focused study session" feel over a generic SaaS look.
- **One accent color, used sparingly.** Indigo marks *the thing to look at*: the active stage, primary actions, headings' kicker text. Everything else stays neutral slate so the accent doesn't get diluted.
- **Status, not decoration.** Color outside of slate/indigo (green, red, amber) is never cosmetic — it always encodes a judgment: correct/wrong, minor/major, easy/hard. If a color appears, it's telling the student something.
- **Calm typography, no custom fonts.** The system font stack (Tailwind's default sans stack) is used throughout — no webfont loading, one less thing to break in a hackathon demo.
- **Content density over chrome.** No sidebars, no nav bar, no modals. A single centered column and a progress bar are the entire navigational surface — the pedagogy is the interface.

---

## 2. Color palette

Built entirely on Tailwind CSS v4's default palette — no custom colors defined anywhere in the project. Reference hex values below are Tailwind's standard `slate`/`indigo`/`emerald`/`rose`/`amber` scales.

### Base (structure)

| Token | Hex | Used for |
|---|---|---|
| `slate-950` | `#020617` | Page background (`body` in `index.css`) |
| `slate-900` (`/70` opacity) | `#0f172a` | Card background — the translucency lets the page background show through slightly |
| `slate-800` | `#1e293b` | Card borders, default `Badge` background, inactive progress-bar segments |
| `slate-700` | `#334155` | Input/textarea/select borders, `GhostButton` border, spinner ring track |
| `slate-600` | `#475569` | `GhostButton` hover border |
| `slate-500` | `#64748b` | (reserved — hover states) |
| `slate-400` | `#94a3b8` | Secondary body text, subtitles, `Spinner` label |
| `slate-300` | `#cbd5e1` | `GhostButton` text, default `Badge` text |
| `slate-100` | `#f1f5f9` | Primary body text (`body` default) |
| `white` | `#ffffff` | Headings, primary button text |

### Accent (attention)

| Token | Hex | Used for |
|---|---|---|
| `indigo-500` | `#6366f1` | `PrimaryButton` background |
| `indigo-400` | `#818cf8` | `PrimaryButton` hover, spinner's spinning arc, active progress-bar segment, stage-progress active label |
| `indigo-300` | `#a5b4fc` | Lesson section headings (`TeachStage`), active stage label |
| `indigo-900` (`/60`) | `#312e81` | `Badge tone="indigo"` background |

### Status colors (semantic only — see §5)

| Status | Background | Text | Meaning |
|---|---|---|---|
| Success / correct | `emerald-900/60` (`#064e3b`) | `emerald-300` (`#6ee7b7`) | Correct diagnostic/check answer, "Good" review rating |
| Error / gap / wrong | `rose-900/60` or `rose-950/40` (`#881337` / `#4c0519`) | `rose-300` / `rose-200` | Wrong answer, prerequisite gap, `ErrorPanel`, "Again" rating |
| Warning / medium severity | `amber-900/60` or `amber-950/30` (`#78350f` / `#451a03`) | `amber-300` / `amber-200` | Medium difficulty, minor gap, demo-mode banner, "Hard" rating |

### Full status-color usage map

These four states appear consistently across the app wherever a judgment is being rendered:

```
green/emerald  →  correct, ready, success
red/rose       →  wrong, gap, error, "Again" (forgotten)
amber          →  medium difficulty, minor severity, warning, "Hard"
indigo         →  neutral highlight / metadata tag, "Easy"
slate          →  default / no judgment yet
```

---

## 3. Typography

No custom font is imported — the app relies entirely on the browser/OS default sans-serif stack via Tailwind's base styles.

| Role | Classes | Example |
|---|---|---|
| Page title | `text-lg font-bold text-white` | "🧭 Adaptive Learning Companion" |
| Stage kicker | `text-xs font-semibold uppercase tracking-widest text-indigo-400` | "STEP 2 OF 5 · DIAGNOSE" |
| Stage title | `text-2xl font-bold text-white` | "First, let's check your foundations" |
| Stage subtitle | `text-sm text-slate-400` | Explanatory copy under each heading |
| Section heading (lesson) | `text-lg font-semibold text-indigo-300` | Lesson section headings in Teach |
| Body text | default `text-slate-100` / `text-slate-200` | Lesson content, questions |
| Micro / labels | `text-xs` | Badges, stage progress labels, "click to reveal" |

**Hierarchy rule:** kicker (small, uppercase, indigo) → title (large, bold, white) → subtitle (small, muted) appears identically at the top of every stage via the shared `StageHeading` component — this repetition is intentional, it's the one piece of consistent orientation as the student moves through five very different-looking screens.

---

## 4. Layout & spacing

- **Single centered column.** Every stage wraps its content in `mx-auto max-w-2xl` (Review uses `max-w-xl`, being a single-card focus view). There is no multi-column layout anywhere.
- **Page chrome:** `px-4 pb-20 pt-8` on the root container — generous bottom padding so the last card never feels flush against the viewport edge.
- **Card as the atomic unit.** Nearly everything is a `Card`: `rounded-2xl border border-slate-800 bg-slate-900/70 p-6`. Stacking `Card`s with `space-y-3`/`space-y-4` is the default way of presenting a list (questions, gaps, flashcards, grading results).
- **Corner radius scale:** `rounded-2xl` for cards/panels (the biggest containers), `rounded-xl` for buttons/inputs/textareas, `rounded-full` for badges and the stage-progress bar segments. Bigger container → bigger radius.
- **Border-first, not shadow-first.** No `box-shadow` is used anywhere in the app; depth and separation come entirely from `border-slate-800`/`border-slate-700` against the dark background. This keeps the dark theme flat and calm instead of muddy.

---

## 5. Component inventory (`src/components/ui.jsx`)

| Component | Purpose | Visual notes |
|---|---|---|
| `Card` | The universal container — wraps a question, a gap, a lesson section, a flashcard, anything | `rounded-2xl`, subtle translucent background, hairline border |
| `PrimaryButton` | The one "go forward" action per screen (Start diagnosis, Submit answers, Continue…) | Solid indigo fill — the only solid-fill button in the app, reserved for forward progress |
| `GhostButton` | Secondary / optional actions (Review flashcards, Show answer) | Outline-only, never competes visually with `PrimaryButton` |
| `Spinner` | Loading state while an LLM call is in flight | Spinning ring (slate track, indigo arc) + a stage-specific label like `Finding the prerequisites of "X"…` so waiting still feels contextual |
| `ErrorPanel` | Shown when an LLM call throws (bad JSON, all models failed) | Rose-tinted card with a message and an inline `Retry` button — never a dead end |
| `Badge` | Small inline status/metadata tag (difficulty, concept tag, correct/gap) | Pill shape, 5 tones (slate/green/red/amber/indigo) — see §2 status map |
| `StageHeading` | The kicker/title/subtitle block at the top of every stage | The one piece of layout repeated identically across all 5 stages, for orientation |

## 6. Page-level elements (`src/App.jsx`)

| Element | Purpose |
|---|---|
| Header logo/title (`🧭 Adaptive Learning Companion`) | Doubles as a "start over" button (`dispatch({ type: "RESET_SESSION" })`) — clicking the compass icon abandons the current session |
| Topic pill (top-right of header) | Persistent reminder of what's being studied once a session starts, so it's never ambiguous mid-flow |
| Demo-mode banner | Amber-toned, only rendered when `isDemoMode` is true — a visible, honest signal that responses are canned, not a silent fallback |
| Stage progress bar | Five equal-width segments + labels (`SETUP` / `DIAGNOSE` / `REMEDIATE` / `TEACH` / `REINFORCE` / `REVIEW` — 6 total including Review); filled indigo for completed/current, slate for upcoming. This is the only navigation affordance in the entire app — deliberately non-clickable, since stages must be completed in order |

## 7. Stage-specific patterns

- **Diagnose / Teach (comprehension check):** each question is its own `Card` with a difficulty `Badge` and a "tests: {concept}" `Badge`, followed by a `textarea`. Difficulty badges use a fixed tone map: `easy → green`, `medium → amber`, `hard → red`.
- **Remediate:** two-part reveal — first a compact grading list (one-line `Card`s with a correct/gap `Badge`), then full mini-lesson `Card`s for each gap, bordered `border-amber-800/50` to visually separate "the fix" from "the assessment."
- **Reinforce:** flashcards are previewed as flat `Card`s (front question bolded, back answer muted) before the student ever enters Review — a preview, not a quiz, at this stage.
- **Review:** the only screen that breaks from the `Card`-list pattern. A single flashcard occupies the layout, built with a CSS 3D flip (`.perspective` / `.flip-inner` / `.flipped` / `.flip-face` / `.flip-back` in `index.css` — 0.45s `rotateY` transition, `backface-visibility: hidden`). Below it, four fixed-color rating buttons map directly to the SM-2 quality scale:

  | Button | Color | SM-2 quality |
  |---|---|---|
  | Again | `bg-rose-600` | 1 |
  | Hard | `bg-amber-600` | 2 |
  | Good | `bg-emerald-600` | 3 |
  | Easy | `bg-indigo-600` | 4 |

  These four are the only fully-saturated, solid-fill colored buttons anywhere in the app — a deliberate exception to "one accent color," because in this one moment the four choices need to be scannable at a glance without reading labels.

---

## 8. States & feedback

- **Loading:** every LLM-backed stage shows the same `Spinner` pattern with a topic-aware label — never a generic "Loading…".
- **Error:** every LLM-backed stage shows the same `ErrorPanel` with a `Retry` button — errors are always recoverable in place, never a redirect or reset.
- **Demo mode:** a persistent, honestly-labeled banner rather than a silent difference in behavior — the user should never wonder why responses feel scripted.
- **Disabled states:** `disabled:opacity-40` (buttons) is the one consistent disabled treatment across the whole app — fading rather than hiding, so the next action is still visible as "coming soon" (e.g., "Submit answers" while questions are still loading).

---

## 9. Iconography

There is exactly one icon in the entire app: the 🧭 compass emoji in the header, chosen to represent "diagnose direction before teaching." No icon library is installed — badges and status communicate through color and text, not glyphs, keeping the bundle small and avoiding icon-alignment fiddling.
