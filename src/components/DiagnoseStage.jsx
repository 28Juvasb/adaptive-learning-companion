import { fetchDiagnosticQuestions } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { groundingText } from "../state/sessionReducer.js";
import { Card, PrimaryButton, GhostButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";
import AttachmentBar from "./AttachmentBar.jsx";

const DIFFICULTY_TONE = { easy: "green", medium: "amber", hard: "red" };

export default function DiagnoseStage({ state, dispatch }) {
  const { topic, level, questions, answers } = state;

  const { loading, error, retry } = useStageFetch(
    async () => {
      const { questions } = await fetchDiagnosticQuestions({
        topic,
        level,
        resources: groundingText(state),
      });
      dispatch({ type: "RECEIVE_QUESTIONS", questions });
    },
    { skip: questions.length > 0 }
  );

  if (loading) return <Spinner label={`Finding the prerequisites of "${topic}"…`} tone="text-blue-500" />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;

  const answeredCount = questions.filter((q) => (answers[q.id] || "").trim()).length;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 2 of 6 · Diagnose"
        title="First, let's check your foundations"
        subtitle={`These test what "${topic}" is built on — not the topic itself. Honest answers beat perfect ones; blanks are treated as gaps to fix.`}
        accent="text-blue-600"
      />

      <AttachmentBar state={state} dispatch={dispatch} />

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="border-blue-200 bg-blue-50/70">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-600">
                {i + 1}
              </span>
              <Badge tone={DIFFICULTY_TONE[q.difficulty]}>{q.difficulty}</Badge>
              <span className="text-sm font-medium text-slate-500">tests: {q.tests_prerequisite}</span>
            </div>
            <p className="mb-3 font-semibold text-[#16202e]">{q.text}</p>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => dispatch({ type: "SET_ANSWER", id: q.id, value: e.target.value })}
              rows={2}
              placeholder="Your answer…"
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {answeredCount}/{questions.length} answered
        </p>
        <div className="flex items-center gap-2">
          <GhostButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "teach" })}>
            Skip diagnosis
          </GhostButton>
          <PrimaryButton onClick={() => dispatch({ type: "SUBMIT_ANSWERS" })}>
            Check my answers →
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
