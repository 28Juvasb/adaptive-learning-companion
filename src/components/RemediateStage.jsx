import { gradeDiagnostics } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";
import AttachmentBar from "./AttachmentBar.jsx";
import Markdown from "./Markdown.jsx";

export default function RemediateStage({ state, dispatch }) {
  const { topic, level, questions, answers, grading, gaps, readyForMain } = state;

  const { loading, error, retry } = useStageFetch(
    async () => {
      const result = await gradeDiagnostics({ topic, level, questions, answers });
      dispatch({ type: "RECEIVE_GAPS", ...result });
    },
    { skip: grading.length > 0 }
  );

  if (loading) return <Spinner label="Grading your answers and finding gaps…" tone="text-orange-500" />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;

  const correctCount = grading.filter((g) => g.correct).length;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 3 of 6 · Remediate"
        title={gaps.length === 0 ? "Solid foundations — no gaps found" : "Let's shore up a couple of gaps"}
        subtitle={`You got ${correctCount}/${grading.length} prerequisite questions right. ${
          gaps.length === 0
            ? "You're ready for the main topic."
            : "Here's how the diagnosis went, and a quick fix for what's missing."
        }`}
        accent="text-orange-600"
      />

      <AttachmentBar state={state} dispatch={dispatch} />

      {/* Per-question grading */}
      <div className="mb-6 space-y-3">
        {grading.map((g) => {
          const q = questions.find((x) => x.id === g.id);
          return (
            <Card key={g.id} className="flex items-center justify-between gap-3 border-orange-200 bg-orange-50/70 py-4">
              <p className="text-sm text-slate-700">{q?.text ?? g.feedback}</p>
              <Badge tone={g.correct ? "green" : "red"}>{g.correct ? "Correct" : "Gap"}</Badge>
            </Card>
          );
        })}
      </div>

      {/* Mini-lessons: "THE FIX" cards with an orange left border */}
      {gaps.length > 0 && (
        <div className="mb-6 space-y-4">
          {gaps.map((gap, i) => (
            <Card key={i} className="border-orange-200 bg-orange-50/70 border-l-4 border-l-orange-500">
              <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-orange-600">
                The fix
              </p>
              <h3 className="mb-2 text-lg font-bold text-[#16202e]">{gap.concept}</h3>
              {gap.correction && (
                <p className="mb-2 text-sm font-medium text-orange-800">{gap.correction}</p>
              )}
              <div className="text-sm text-slate-700">
                <Markdown>{gap.mini_lesson}</Markdown>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <PrimaryButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "teach" })}>
          {readyForMain === false ? "Got it — teach me →" : "Continue to the lesson →"}
        </PrimaryButton>
      </div>
    </div>
  );
}
