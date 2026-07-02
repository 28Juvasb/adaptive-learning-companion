import { gradeDiagnostics } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";

export default function RemediateStage({ state, dispatch }) {
  const { topic, level, questions, answers, grading, gaps, readyForMain } = state;

  const { loading, error, retry } = useStageFetch(
    async () => {
      const result = await gradeDiagnostics({ topic, level, questions, answers });
      dispatch({ type: "RECEIVE_GAPS", ...result });
    },
    { skip: grading.length > 0 }
  );

  if (loading) return <Spinner label="Grading your answers and finding gaps…" />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;

  const correctCount = grading.filter((g) => g.correct).length;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 3 of 5 · Remediate"
        title={
          gaps.length === 0
            ? "Solid foundations — no gaps found!"
            : `Let's fix ${gaps.length} gap${gaps.length > 1 ? "s" : ""} before the lesson`
        }
        subtitle={`You got ${correctCount}/${grading.length} prerequisite questions right. ${
          gaps.length === 0
            ? "You're ready for the main topic."
            : "Read the mini-lessons below — the main lesson builds on them."
        }`}
      />

      {/* Per-question feedback */}
      <div className="mb-6 space-y-3">
        {grading.map((g) => {
          const q = questions.find((x) => x.id === g.id);
          return (
            <Card key={g.id} className="py-4">
              <div className="mb-1 flex items-center gap-2">
                <Badge tone={g.correct ? "green" : "red"}>{g.correct ? "✓ correct" : "✗ gap"}</Badge>
                {q && <span className="text-sm text-slate-400">{q.tests_prerequisite}</span>}
              </div>
              <p className="text-sm text-slate-300">{g.feedback}</p>
            </Card>
          );
        })}
      </div>

      {/* Mini-lessons for each gap */}
      {gaps.length > 0 && (
        <div className="mb-6 space-y-4">
          {gaps.map((gap, i) => (
            <Card key={i} className="border-amber-800/50">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={gap.severity === "major" ? "red" : "amber"}>
                  {gap.severity} gap
                </Badge>
                <h3 className="font-semibold text-white">{gap.concept}</h3>
              </div>
              {gap.correction && (
                <p className="mb-2 text-sm font-medium text-amber-200">{gap.correction}</p>
              )}
              <p className="text-sm leading-relaxed text-slate-300">{gap.mini_lesson}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <PrimaryButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "teach" })}>
          {readyForMain === false ? "I've read the mini-lessons — teach me →" : "Continue to the lesson →"}
        </PrimaryButton>
      </div>
    </div>
  );
}
