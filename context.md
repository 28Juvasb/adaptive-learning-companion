# context.md — Product & Design Context

The "why" behind the Adaptive Learning Companion. `CLAUDE.md` covers *how the code works*; this file covers *what we're building and why the decisions were made*, so anyone (human or AI) can extend it without re-deriving the intent.

---

## 1. The problem

Generic AI tutors (ChatGPT, etc.) answer whatever a student asks — but they never check whether the student can actually follow the answer. A student with a broken prerequisite gets a fluent, confident explanation built on a foundation they don't have, and comes away *more* confused while feeling like they learned something. And once the chat ends, the learning evaporates: nothing schedules review, so it's forgotten within days.

Two gaps, both unaddressed by "just ask an AI":
- **No diagnosis.** The tutor teaches on top of whatever holes exist.
- **No retention.** One-shot explanations aren't reinforced over time.

## 2. The solution

A tutor that **refuses to teach on a broken foundation** and **doesn't let learning evaporate**. It runs a fixed pedagogical loop:

> diagnose prerequisites → remediate gaps → teach the target → reinforce via spaced repetition

The insight for judges: **the loop is the product, not the chat UI.** Any LLM can generate a lesson. The differentiation is the *sequence* — checking readiness before teaching, and converting mistakes into a review schedule after.

## 3. Target learner

General / all levels — **level is a user input, never hardcoded.** K–12, competitive-exam prep, college, adult self-learners. The impact angle for the pitch: students *without* access to a human tutor who could otherwise diagnose their individual gaps (tier-2/3 schools, self-learners, exam prep).

## 4. The five stages — intent behind each

| Stage | What the user sees | Why it exists |
|---|---|---|
| **Setup** | Topic + level + optional pasted material | Level personalizes everything downstream. Pasted text lets the tutor teach from the student's *own* syllabus (grounding), which is the roadmap toward full RAG. |
| **Diagnose** | 3–5 questions on *prerequisites*, not the topic | This is the whole thesis. Questions probe what the topic is built on. Blank answers are explicitly framed as "gaps to fix, not failures" to reduce anxiety and encourage honesty. |
| **Remediate** | Per-answer feedback + mini-lessons for gaps | Closes gaps *before* the main lesson so the lesson doesn't rest on a hole. Severity (minor/major) drives whether the student is "ready." |
| **Teach** | Sectioned lesson + comprehension check | The actual teaching, at the student's level, grounded in their material if provided. The check surfaces new mistakes to feed the next stage. |
| **Reinforce** | Auto-generated flashcards | Every wrong answer + weak concept becomes an atomic flashcard. This is the "don't let it evaporate" half of the pitch. |
| **Review** | Flashcard review with SM-2-lite scheduling | Spaced repetition. Ratings (Again/Hard/Good/Easy) set the next due date. Persists across visits via localStorage. |

## 5. Key design decisions (and the trade-offs)

- **Client-only, no backend.** Everything is React + localStorage + direct LLM calls. Zero infra to stand up for a one-day build; the cost is that the API key ships to the browser (fine for a demo, flagged as a roadmap item for production).
- **OpenRouter free tier.** One OpenAI-compatible endpoint, multiple free models, no credit card. The risk is rate-limiting mid-demo — mitigated by (a) ordered model failover in `openrouter.js` and (b) a full **demo mode** with canned responses when no key is present.
- **Strict JSON contracts + validators.** Free models are less reliable at instruction-following than frontier models, so every response is validated and normalized before use, and prompts hammer "raw JSON only." This is the single biggest source of demo fragility, so it got the most defensive engineering.
- **SM-2-lite, not full FSRS.** A simplified SuperMemo-2 scheduler is enough to *demonstrate* spaced repetition without the complexity. Pure client-side math, no LLM call.
- **`useReducer`, not Redux.** The app is one linear state machine; a reducer is the right size.
- **Demo mode as a first-class feature.** Not a mock for tests — a live fallback so the app is always demonstrable even with no key and no network. Canned responses are topic-aware (they interpolate the entered topic) so the demo still feels real.

## 6. Scope boundaries

**In scope (built):** full 5-stage loop, real LLM calls, pasted-text grounding, localStorage flashcards, SM-2-lite scheduler, model failover, demo mode.

**Out of scope (roadmap — mention in pitch, don't build):** user accounts / multi-user, PDF/file upload + RAG, cross-visit session history (only the deck persists, not sessions), analytics dashboard, mobile app, server-side key handling.

## 7. Demo narrative (the 2-minute pitch flow)

1. Enter **"Photosynthesis"**, level **"High school"**. → *"Notice it doesn't teach yet."*
2. Diagnose asks about **prerequisites** (energy, molecules) not photosynthesis itself. → *"It's checking the foundation."*
3. Leave one blank. Remediate **catches the gap and teaches it first**. → *"It refuses to build on a hole."*
4. Teach delivers the lesson + checks understanding. → *"Now it teaches, at the student's level."*
5. Reinforce turns the mistakes into **flashcards**; Review schedules them. → *"And it won't let the learning evaporate."*

Rehearse this exact run before presenting — with a real key, free models occasionally hiccup, and demo mode is the safety net if they do.

## 8. Judging alignment (Samsung Solve for Tomorrow)

- **Problem clarity:** a specific, real failure of existing AI tutoring, not "AI for education" in the abstract.
- **Innovation:** the diagnose-before-teach + reinforce loop, not another chat wrapper.
- **Impact:** works for any subject/level; strongest for learners without human tutors.
- **Feasibility:** a working end-to-end MVP, today, on free infrastructure.
