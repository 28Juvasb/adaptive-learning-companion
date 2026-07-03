import { useState } from "react";
import { fetchLesson, gradeComprehension } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { groundingText } from "../state/sessionReducer.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";
import Markdown from "./Markdown.jsx";
import ChatPanel from "./ChatPanel.jsx";

export default function TeachStage({ state, dispatch }) {
  const { topic, level, solidPrereqs, gaps, lesson, checkAnswers, checkResults } = state;
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  const { loading, error, retry } = useStageFetch(
    async () => {
      const result = await fetchLesson({
        topic,
        level,
        solidPrereqs,
        gaps,
        resources: groundingText(state),
      });
      dispatch({ type: "RECEIVE_LESSON", lesson: result });
    },
    { skip: lesson !== null }
  );

  if (loading)
    return <Spinner label={`Writing your in-depth "${topic}" lesson…`} tone="text-amber-500" />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;
  if (!lesson) return null;

  async function submitCheck() {
    setGrading(true);
    setGradeError(null);
    try {
      const results = await gradeComprehension({
        topic,
        level,
        checkQuestions: lesson.check_questions,
        checkAnswers,
      });
      dispatch({ type: "RECEIVE_CHECK_RESULTS", results });
    } catch (err) {
      setGradeError(err?.message ?? "Grading failed.");
    } finally {
      setGrading(false);
    }
  }

  const groundedNote = groundingText(state) ? " · grounded in your material" : "";

  return (
    <div className="mx-auto max-w-5xl">
      <StageHeading
        kicker="Step 4 of 6 · Teach"
        title="Here's the full picture"
        subtitle={`Taught for: ${level}${groundedNote}. Read through, then a quick check — and ask the tutor anything on the right.`}
        accent="text-amber-600"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        {/* Lesson + comprehension check */}
        <div>
          <div className="space-y-4">
            {lesson.lesson_sections.map((s, i) => (
              <Card key={i} className="border-amber-200 bg-amber-50/70">
                <h3 className="mb-2 text-lg font-bold text-amber-700">{s.heading}</h3>
                <Markdown>{s.content}</Markdown>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <StageHeading
              kicker="Quick check"
              title="Did it land?"
              subtitle="Answer in your own words — mistakes here become flashcards, not penalties."
              accent="text-amber-600"
            />
            <div className="space-y-4">
              {lesson.check_questions.map((q, i) => {
                const result = checkResults?.find((r) => r.id === q.id);
                return (
                  <Card key={q.id} className="border-black/5 bg-white/70">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-amber-600">C{i + 1}</span>
                      <Badge tone="amber">{q.concept_tag}</Badge>
                      {result && (
                        <Badge tone={result.correct ? "green" : "red"}>
                          {result.correct ? "Correct" : "Needs work"}
                        </Badge>
                      )}
                    </div>
                    <p className="mb-3 font-semibold text-[#16202e]">{q.text}</p>
                    <textarea
                      value={checkAnswers[q.id] || ""}
                      onChange={(e) => dispatch({ type: "SET_CHECK_ANSWER", id: q.id, value: e.target.value })}
                      rows={2}
                      disabled={checkResults !== null}
                      placeholder="Your answer…"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 disabled:opacity-60"
                    />
                    {result && !result.correct && result.correction && (
                      <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {result.correction}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>

            {gradeError && (
              <div className="mt-4">
                <ErrorPanel message={gradeError} onRetry={submitCheck} />
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {checkResults === null ? (
                <PrimaryButton onClick={submitCheck} disabled={grading}>
                  {grading ? "Grading…" : "Check my understanding →"}
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "reinforce" })}>
                  Turn my mistakes into flashcards →
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>

        {/* Follow-up chat — sticky on large screens */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ChatPanel state={state} dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}
