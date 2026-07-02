import { fetchDiagnosticQuestions } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";

const DIFFICULTY_TONE = { easy: "green", medium: "amber", hard: "red" };

export default function DiagnoseStage({ state, dispatch }) {
  const { topic, level, resources, questions, answers } = state;

  const { loading, error, retry } = useStageFetch(
    async () => {
      const { questions } = await fetchDiagnosticQuestions({ topic, level, resources });
      dispatch({ type: "RECEIVE_QUESTIONS", questions });
    },
    { skip: questions.length > 0 }
  );

  if (loading) return <Spinner label={`Finding the prerequisites of "${topic}"…`} />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;

  const answeredCount = questions.filter((q) => (answers[q.id] || "").trim()).length;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 2 of 5 · Diagnose"
        title="First, let's check your foundations"
        subtitle={`These questions test what "${topic}" is built on — not the topic itself. Answer honestly; blank answers are treated as gaps to fix, not failures.`}
      />

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-400">Q{i + 1}</span>
              <Badge tone={DIFFICULTY_TONE[q.difficulty]}>{q.difficulty}</Badge>
              <Badge>tests: {q.tests_prerequisite}</Badge>
            </div>
            <p className="mb-3 text-slate-100">{q.text}</p>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => dispatch({ type: "SET_ANSWER", id: q.id, value: e.target.value })}
              rows={2}
              placeholder="Your answer (or leave blank if unsure)…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500"
            />
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {answeredCount}/{questions.length} answered
        </p>
        <PrimaryButton onClick={() => dispatch({ type: "SUBMIT_ANSWERS" })}>
          Submit answers →
        </PrimaryButton>
      </div>
    </div>
  );
}
