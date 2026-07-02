import { useState } from "react";
import { fetchLesson, gradeComprehension } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";

export default function TeachStage({ state, dispatch }) {
  const { topic, level, resources, solidPrereqs, gaps, lesson, checkAnswers, checkResults } = state;
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  const { loading, error, retry } = useStageFetch(
    async () => {
      const result = await fetchLesson({ topic, level, solidPrereqs, gaps, resources });
      dispatch({ type: "RECEIVE_LESSON", lesson: result });
    },
    { skip: lesson !== null }
  );

  if (loading) return <Spinner label={`Building your "${topic}" lesson on the foundations we just confirmed…`} />;
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

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 4 of 5 · Teach"
        title={topic}
        subtitle={`Taught at your level: ${level}${resources ? " · grounded in your pasted material" : ""}`}
      />

      {/* Lesson sections */}
      <div className="mb-8 space-y-4">
        {lesson.lesson_sections.map((s, i) => (
          <Card key={i}>
            <h3 className="mb-2 text-lg font-semibold text-indigo-300">{s.heading}</h3>
            <p className="whitespace-pre-line leading-relaxed text-slate-200">{s.content}</p>
          </Card>
        ))}
      </div>

      {/* Comprehension check */}
      <StageHeading kicker="Quick check" title="Did it land?" subtitle="Answer in your own words — mistakes here become flashcards, not penalties." />
      <div className="space-y-4">
        {lesson.check_questions.map((q, i) => {
          const result = checkResults?.find((r) => r.id === q.id);
          return (
            <Card key={q.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-400">C{i + 1}</span>
                <Badge>{q.concept_tag}</Badge>
                {result && (
                  <Badge tone={result.correct ? "green" : "red"}>
                    {result.correct ? "✓ correct" : "✗ needs work"}
                  </Badge>
                )}
              </div>
              <p className="mb-3 text-slate-100">{q.text}</p>
              <textarea
                value={checkAnswers[q.id] || ""}
                onChange={(e) => dispatch({ type: "SET_CHECK_ANSWER", id: q.id, value: e.target.value })}
                rows={2}
                disabled={checkResults !== null}
                placeholder="Your answer…"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              {result && !result.correct && result.correction && (
                <p className="mt-2 rounded-lg bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
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
  );
}
