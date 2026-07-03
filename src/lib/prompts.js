// All stage prompt templates + response validators.
// Every stage function returns a Promise of validated, normalized JSON.

import { callLLM, callLLMStream, LLMError } from "./openrouter.js";

const JSON_RULES =
  "Return ONLY raw valid JSON. No markdown fences, no preamble, no commentary, no trailing text. " +
  "Use double quotes for all keys and strings.";

function requireArray(json, key, label) {
  if (!json || !Array.isArray(json[key]) || json[key].length === 0) {
    throw new LLMError(`Model response was missing "${key}" (${label}). Retry.`);
  }
  return json[key];
}

const str = (v, fallback = "") => (typeof v === "string" ? v : fallback);

// ---------------------------------------------------------------------------
// Stage 0 — Scope: break a broad topic into masterable subtopics
// ---------------------------------------------------------------------------

export function fetchSubtopics({ topic, level, resources }) {
  const system = `You are a curriculum planner. Decide whether a topic is too BROAD to master well in a single focused session at the given level.

- If broad (e.g. "Calculus", "World War 2", "Machine Learning"), break it into 4-7 FOCUSED subtopics, each of which genuinely can be mastered in one session, ordered as a sensible learning path.
- If already narrow enough to teach deeply in one session (e.g. "Recursion in Python", "The causes of WW1"), set "is_broad" to false and return an empty subtopics list.

${JSON_RULES}
Shape:
{
  "is_broad": true,
  "subtopics": [ { "title": "focused subtopic", "blurb": "one short line on what it covers" } ]
}`;

  const user = `Topic: ${topic}\nTarget level: ${level}\nResources to consider (may be empty): ${resources || "none"}`;

  return callLLM(system, user, {
    mockKey: "scope",
    mockContext: { topic },
    validate: (json) => {
      const subtopics = (Array.isArray(json.subtopics) ? json.subtopics : [])
        .map((s) => ({ title: str(s.title), blurb: str(s.blurb) }))
        .filter((s) => s.title);
      return { is_broad: json.is_broad === true && subtopics.length >= 2, subtopics: subtopics.slice(0, 7) };
    },
  });
}

// ---------------------------------------------------------------------------
// Stage 1 — Diagnose: generate prerequisite questions
// ---------------------------------------------------------------------------

export function fetchDiagnosticQuestions({ topic, level, resources }) {
  const system = `You are an expert tutor diagnosing prerequisite knowledge. Given a topic and target level, generate exactly 4 short-answer questions that test the FOUNDATIONAL concepts required to learn this topic — NOT the topic itself. Order questions from easy to hard. Questions must be answerable in 1-3 sentences.

${JSON_RULES}
Shape:
{
  "questions": [
    { "id": "q1", "text": "...", "tests_prerequisite": "name of prerequisite concept", "difficulty": "easy" }
  ]
}
"difficulty" must be one of: "easy", "medium", "hard".`;

  const user = `Topic: ${topic}\nTarget level: ${level}\nResources to consider (may be empty): ${resources || "none"}`;

  return callLLM(system, user, {
    mockKey: "diagnose",
    mockContext: { topic },
    validate: (json) => {
      const questions = requireArray(json, "questions", "diagnostic questions").map((q, i) => ({
        id: str(q.id, `q${i + 1}`),
        text: str(q.text),
        tests_prerequisite: str(q.tests_prerequisite, "general foundation"),
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
      }));
      if (questions.some((q) => !q.text)) throw new LLMError("A question had no text. Retry.");
      return { questions: questions.slice(0, 5) };
    },
  });
}

// ---------------------------------------------------------------------------
// Stage 2 — Remediate: grade answers, find gaps, teach mini-lessons
// ---------------------------------------------------------------------------

export function gradeDiagnostics({ topic, level, questions, answers }) {
  const system = `You are grading a student's answers to prerequisite diagnostic questions. For each answer, judge correctness generously (partial understanding counts as correct) and give one sentence of feedback. For each WRONG or blank answer, identify the specific concept gap and write a short corrective mini-lesson. Then decide if the student is ready for the main topic (ready when there are no "major" gaps).

${JSON_RULES}
Shape:
{
  "grading": [ { "id": "q1", "correct": true, "feedback": "one sentence" } ],
  "gaps": [
    { "concept": "...", "severity": "minor", "correction": "1-2 sentence correction", "mini_lesson": "3-5 sentence teaching of the gap" }
  ],
  "solid_prerequisites": ["concepts the student clearly has"],
  "ready_for_main": true
}
"severity" must be "minor" or "major". "gaps" may be an empty array. Include one "grading" entry per question, matching the question ids.`;

  const pairs = questions
    .map(
      (q) =>
        `Question ${q.id} (tests: ${q.tests_prerequisite}): ${q.text}\nStudent answer: ${
          (answers[q.id] || "").trim() || "(left blank)"
        }`
    )
    .join("\n\n");

  const user = `Topic the student wants to learn: ${topic}\nTarget level: ${level}\n\n${pairs}`;

  return callLLM(system, user, {
    mockKey: "remediate",
    mockContext: { topic, questions, answers },
    validate: (json) => {
      const grading = requireArray(json, "grading", "answer grading").map((g, i) => ({
        id: str(g.id, questions[i]?.id ?? `q${i + 1}`),
        correct: g.correct === true,
        feedback: str(g.feedback),
      }));
      const gaps = (Array.isArray(json.gaps) ? json.gaps : []).map((g) => ({
        concept: str(g.concept, "unnamed concept"),
        severity: g.severity === "major" ? "major" : "minor",
        correction: str(g.correction),
        mini_lesson: str(g.mini_lesson),
      }));
      return {
        grading,
        gaps,
        solidPrereqs: Array.isArray(json.solid_prerequisites)
          ? json.solid_prerequisites.filter((s) => typeof s === "string")
          : [],
        readyForMain: json.ready_for_main !== false,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Stage 3 — Teach: deliver the lesson + comprehension check questions
// ---------------------------------------------------------------------------

export function fetchLesson({ topic, level, solidPrereqs, gaps, resources }) {
  const system = `You are an expert tutor teaching a topic at the student's specified level. Teach in DEPTH — this is a full lesson, not a summary. If resources are provided, ground the lesson in them and prefer their framing.

Requirements:
- Write 4-6 substantial sections. Each section's "content" is 5-10 sentences of clear, concrete explanation with a worked example, analogy, or concrete case, not a bland overview.
- The "content" field is MARKDOWN: use **bold**, bullet lists, and — when the topic is technical or code-related — fenced code blocks with a language tag (e.g. \`\`\`python). Code MUST be correct and runnable; double-check syntax before including it.
- Include at least one concrete example or mini case study that ties the concepts together.
- Briefly connect back to any prerequisite gaps that were just remediated.
- End with exactly 3 short-answer comprehension-check questions about the lesson content.

${JSON_RULES}
Note: JSON string values may contain markdown and code, but the OUTER structure must be valid JSON (escape newlines as \\n and quotes as \\").
Shape:
{
  "lesson_sections": [ { "heading": "...", "content": "markdown with **bold**, lists, and code blocks where relevant" } ],
  "check_questions": [ { "id": "c1", "text": "...", "concept_tag": "..." } ]
}`;

  const user = `Topic: ${topic}
Target level: ${level}
Confirmed-solid prerequisites: ${solidPrereqs.length ? solidPrereqs.join(", ") : "unknown"}
Recently remediated gaps: ${gaps.length ? gaps.map((g) => g.concept).join(", ") : "none"}
Resources (may be empty): ${resources || "none"}`;

  return callLLM(system, user, {
    mockKey: "teach",
    mockContext: { topic },
    validate: (json) => {
      const sections = requireArray(json, "lesson_sections", "lesson sections").map((s) => ({
        heading: str(s.heading, "Section"),
        content: str(s.content),
      }));
      const checks = requireArray(json, "check_questions", "comprehension questions").map((c, i) => ({
        id: str(c.id, `c${i + 1}`),
        text: str(c.text),
        concept_tag: str(c.concept_tag, "core concept"),
      }));
      return { lesson_sections: sections, check_questions: checks.slice(0, 3) };
    },
  });
}

// ---------------------------------------------------------------------------
// Stage 3b — Grade the comprehension check
// ---------------------------------------------------------------------------

export function gradeComprehension({ topic, level, checkQuestions, checkAnswers }) {
  const system = `You are grading a student's answers to comprehension-check questions about a lesson they just received. Judge correctness generously. For wrong or blank answers, give a 1-2 sentence correction.

${JSON_RULES}
Shape:
{
  "results": [ { "id": "c1", "correct": true, "correction": "", "concept_tag": "..." } ]
}
Include one entry per question, matching ids. "correction" may be an empty string for correct answers.`;

  const pairs = checkQuestions
    .map(
      (q) =>
        `Question ${q.id} (concept: ${q.concept_tag}): ${q.text}\nStudent answer: ${
          (checkAnswers[q.id] || "").trim() || "(left blank)"
        }`
    )
    .join("\n\n");

  const user = `Topic: ${topic}\nLevel: ${level}\n\n${pairs}`;

  return callLLM(system, user, {
    mockKey: "checkGrade",
    mockContext: { checkQuestions, checkAnswers },
    validate: (json) => {
      const results = requireArray(json, "results", "check grading").map((r, i) => ({
        id: str(r.id, checkQuestions[i]?.id ?? `c${i + 1}`),
        correct: r.correct === true,
        correction: str(r.correction),
        concept_tag: str(r.concept_tag, checkQuestions[i]?.concept_tag ?? "core concept"),
      }));
      return results;
    },
  });
}

// ---------------------------------------------------------------------------
// Stage 4 — Reinforce: convert weaknesses into flashcards
// ---------------------------------------------------------------------------

export function fetchFlashcards({ topic, level, weakConcepts, lessonSections = [], count = 15 }) {
  const n = Math.max(6, Math.min(24, count));
  const system = `Convert a full study session into a COMPREHENSIVE deck of atomic spaced-repetition flashcards. Each card tests ONE concept, is concise, and avoids yes/no phrasing. Fronts are questions or prompts; backs are short factual answers (1-3 sentences). Vary difficulty across the deck.

Coverage requirements — the deck must be thorough, not a token sample:
1. At least one card for EVERY wrong answer / weak concept from this session (highest priority).
2. At least one card for EACH lesson section's key idea.
3. Cards for the important definitions, terms, formulas, or (for coding) syntax/patterns in the material.
Generate exactly ${n} cards. If you run short, add cards for finer details rather than padding with duplicates.

${JSON_RULES}
Shape:
{
  "cards": [
    { "front": "question or prompt", "back": "answer", "concept_tag": "...", "difficulty": "easy" }
  ]
}
"difficulty" must be "easy", "medium", or "hard".`;

  const sectionList = lessonSections.length
    ? `\n\nLesson sections to cover (make cards for each):\n${lessonSections
        .map((s) => `- ${s.heading}: ${String(s.content).replace(/\s+/g, " ").slice(0, 240)}`)
        .join("\n")}`
    : "";

  const weakList = weakConcepts.length
    ? `\n\nWrong answers / weak concepts from this session (cover every one):\n${weakConcepts
        .map((w) => `- ${w}`)
        .join("\n")}`
    : "\n\nThe student made no mistakes this session — focus on comprehensive coverage of the material.";

  const user = `Topic: ${topic} (level: ${level})\nProduce exactly ${n} flashcards.${weakList}${sectionList}`;

  return callLLM(system, user, {
    mockKey: "reinforce",
    mockContext: { topic, weakConcepts, count: n, lessonSections },
    validate: (json) => {
      const cards = requireArray(json, "cards", "flashcards")
        .map((c) => ({
          front: str(c.front),
          back: str(c.back),
          concept_tag: str(c.concept_tag, "core concept"),
          difficulty: ["easy", "medium", "hard"].includes(c.difficulty) ? c.difficulty : "medium",
        }))
        .filter((c) => c.front && c.back);
      if (cards.length === 0) throw new LLMError("No usable flashcards in response. Retry.");
      return cards.slice(0, n);
    },
  });
}

// ---------------------------------------------------------------------------
// Follow-up chat — streamed, in-depth, code-aware answers grounded in the
// current session (topic, level, lesson, uploaded docs) + conversation history.
// ---------------------------------------------------------------------------

const CHAT_SYSTEM = `You are the student's expert tutor inside an adaptive learning app. Answer follow-up questions in DEPTH and with precision — the student explicitly wants thorough explanations and full case studies, not brief overviews.

Rules:
- Respond in GitHub-flavored markdown: headings, **bold**, bullet/numbered lists, and tables where they help.
- For any code or technical topic, include CORRECT, runnable code in fenced blocks with a language tag (e.g. \`\`\`js). Verify syntax before answering — wrong code is the worst failure here.
- When the student asks for a case study or "cover everything," structure a complete walkthrough: context, the key ideas, a worked example, common pitfalls, and a short summary.
- Ground answers in the provided lesson and any uploaded documents when relevant; if the documents don't cover something, say so and answer from expertise.
- Be accurate and concrete. Prefer specific examples over vague generalities. Never invent facts about the uploaded documents.`;

function buildContext({ topic, level, resources, lesson }) {
  let ctx = `The student is studying: ${topic} (level: ${level}).`;
  if (lesson?.lesson_sections?.length) {
    ctx +=
      "\n\nLesson they just received:\n" +
      lesson.lesson_sections.map((s) => `## ${s.heading}\n${s.content}`).join("\n\n");
  }
  if (resources) {
    ctx += `\n\nUploaded / pasted study material (ground answers in this when relevant):\n${resources.slice(0, 12000)}`;
  }
  return ctx;
}

/**
 * Stream a tutor answer. `history` is prior [{role:'user'|'assistant', content}].
 * Calls onToken(chunk) as text arrives; resolves to the full answer string.
 */
export function streamTutorAnswer({ topic, level, resources, lesson, history, question }, onToken) {
  const messages = [
    { role: "system", content: CHAT_SYSTEM },
    { role: "system", content: buildContext({ topic, level, resources, lesson }) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: question },
  ];

  const mockAnswer = `Here's a deeper look at **${question.trim() || topic}** in the context of *${topic}*.

Since this is demo mode, I'm returning a canned answer, but with a real API key I'd give a full, grounded explanation — including a worked example and, for coding topics, correct fenced code like:

\`\`\`js
function example() {
  return "add your OpenRouter key in .env.local for live answers";
}
\`\`\`

**Key points**
- I answer in depth, not brief overviews.
- I ground answers in your uploaded PDFs/DOCX when relevant.
- I stream tokens as they arrive so you're not left waiting.`;

  return callLLMStream(messages, onToken, { mockAnswer });
}
