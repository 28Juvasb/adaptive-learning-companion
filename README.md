# 🧭 Adaptive Learning Companion

An AI tutor that **diagnoses what you're missing before it teaches**, fixes those gaps, teaches the topic at your level, then turns every mistake into spaced-repetition flashcards.

Built for the **Samsung Solve for Tomorrow** hackathon. The pedagogical loop — diagnose → remediate → teach → reinforce → review — is the product.

> **Just want to try it?** It runs with **zero setup** in demo mode (canned responses, no API key). For real AI tutoring, add a free OpenRouter key (2 minutes, no credit card). Both paths are below.

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Run

```bash
npm run dev
```

Open **http://localhost:5173**. That's it — the app works immediately in **demo mode** (a yellow banner confirms it). Demo mode returns realistic, topic-aware canned responses so you can walk the entire loop with no key and no network.

### 3. (Optional) Enable real AI tutoring

1. Get a free key: go to **[openrouter.ai](https://openrouter.ai)** → sign up → **Keys** → **Create Key**. No credit card needed for free models.
2. Open **`.env.local`** in the project root and paste your key:
   ```
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
3. **Restart the dev server** (`Ctrl+C`, then `npm run dev` again). Vite only reads env vars at startup. The yellow demo banner disappears — you're now on live models.

---

## How to use it (the 5-stage loop)

| Step | Stage | What you do | What it does |
|---|---|---|---|
| 1 | **Setup** | Type a topic (e.g. *Photosynthesis*), pick your level, optionally paste study notes | Prepares to diagnose — it does **not** teach yet |
| 2 | **Diagnose** | Answer 3–5 short questions | Tests the **prerequisites** of your topic, not the topic itself. Blank answers are fine — they're treated as gaps to fix |
| 3 | **Remediate** | Read the feedback | Grades your answers, then teaches mini-lessons for anything you got wrong — **before** the main lesson |
| 4 | **Teach** | Read the lesson, answer the comprehension check | Teaches the topic at your level (grounded in your pasted notes if you gave any), then checks you understood |
| 5 | **Reinforce → Review** | Rate each flashcard: Again / Hard / Good / Easy | Your mistakes become flashcards, scheduled for spaced review. Your rating sets when each card comes back |

**Flashcards persist** across visits (saved in your browser's localStorage). When cards are due, the Setup screen shows a **"Review flashcards (N due)"** button so you can review without starting a new topic.

### Suggested first run
Topic **"Photosynthesis"**, level **"High school"**, leave one diagnostic question blank on purpose — you'll see the tutor catch the gap and remediate it before teaching. This is the demo-worthy path.

---

## How it works (under the hood)

```
Setup ──▶ Diagnose ──▶ Remediate ──▶ Teach ──▶ Reinforce ──▶ Review
 (form)   (LLM: Qs)    (LLM: grade)  (LLM:      (LLM: cards)   (SM-2, no LLM)
                                      lesson)
```

- **Single-page React app** (Vite + Tailwind). One `useReducer` state machine drives all five stages — see [`src/state/sessionReducer.js`](src/state/sessionReducer.js).
- **Every stage calls an LLM** through one hardened wrapper ([`src/lib/openrouter.js`](src/lib/openrouter.js)) that enforces JSON, strips stray markdown, and **fails over across multiple free models** if one is rate-limited.
- **Every response is validated** ([`src/lib/prompts.js`](src/lib/prompts.js)) before the UI touches it, because free models occasionally return malformed JSON.
- **Spaced repetition** is a client-side SM-2-lite scheduler ([`src/lib/srs.js`](src/lib/srs.js)) — no LLM, no server.
- **Demo mode** ([`src/lib/mocks.js`](src/lib/mocks.js)) kicks in automatically when no API key is set, so the app is always demonstrable.

For deeper detail: [`CLAUDE.md`](CLAUDE.md) (code architecture & invariants) and [`context.md`](context.md) (product rationale & pitch).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Still see the yellow **demo-mode banner** after adding a key | You must **restart the dev server** — Vite reads `.env.local` only at startup. |
| **"All models failed"** error panel | Free tier is rate-limited (~20 req/min). Wait ~30s and click **Retry**, or edit `MODELS` in [`src/lib/openrouter.js`](src/lib/openrouter.js) to put a different model first. |
| A stage shows **"malformed JSON" / missing field** | A free model returned bad output. Click **Retry** — the next attempt (or fallback model) usually succeeds. |
| Rate-limited **mid-demo** | Reorder `MODELS` in [`src/lib/openrouter.js`](src/lib/openrouter.js) (one-line change), or just remove the key to fall back to instant demo mode. |
| Flashcards disappeared | They're in browser localStorage under `alc_flashcards`. Clearing site data or switching browsers wipes them. |
| Port 5173 in use | Vite auto-picks the next free port — check the terminal output for the actual URL. |

### Free-tier limits
OpenRouter free models allow roughly **20 requests/minute** and **~1000/day** — comfortably enough for testing and a live demo. A full loop is ~5 LLM calls.

---

## Project layout

```
├── CLAUDE.md              # architecture, invariants, gotchas (read before editing code)
├── context.md             # product rationale, design decisions, pitch narrative
├── README.md              # this file — setup & usage
├── .env.local             # your OpenRouter key goes here (gitignored)
├── index.html
├── vite.config.js
└── src/
    ├── App.jsx            # stage router + top-level state
    ├── state/             # the 5-stage reducer
    ├── lib/               # LLM wrapper, prompts+validators, SRS, storage, mocks
    └── components/        # one component per stage + shared UI
```

---

## Commands

```bash
npm install      # install dependencies (once)
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

---

## Roadmap (not built — pitch as "next")

PDF/resource upload with RAG · multi-session progress tracking · teacher/parent dashboards · user accounts · server-side key handling · mobile app.
