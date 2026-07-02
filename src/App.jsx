import { useReducer, useState } from "react";
import { sessionReducer, initialState, STAGES, STAGE_LABELS } from "./state/sessionReducer.js";
import { loadDeck } from "./lib/storage.js";
import { getDueCards } from "./lib/srs.js";
import { isDemoMode } from "./lib/openrouter.js";
import SetupStage from "./components/SetupStage.jsx";
import DiagnoseStage from "./components/DiagnoseStage.jsx";
import RemediateStage from "./components/RemediateStage.jsx";
import TeachStage from "./components/TeachStage.jsx";
import ReinforceStage from "./components/ReinforceStage.jsx";
import ReviewStage from "./components/ReviewStage.jsx";

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [deck, setDeck] = useState(loadDeck);

  const dueCount = getDueCards(deck).length;
  const stageIndex = STAGES.indexOf(state.stage);

  return (
    <div className="min-h-screen px-4 pb-20 pt-8">
      <header className="mx-auto mb-10 max-w-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => dispatch({ type: "RESET_SESSION" })}
            className="text-left"
            title="Start over"
          >
            <h1 className="text-lg font-bold text-white">
              🧭 Adaptive Learning Companion
            </h1>
            <p className="text-xs text-slate-500">diagnose → remediate → teach → reinforce → review</p>
          </button>
          {state.topic && (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {state.topic}
            </span>
          )}
        </div>

        {isDemoMode && (
          <div className="mt-4 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-2 text-xs text-amber-200">
            <strong>Demo mode:</strong> no API key found — showing canned responses. Add your
            OpenRouter key to <code className="text-amber-100">.env.local</code> and restart for real
            AI tutoring.
          </div>
        )}

        {/* Stage progress */}
        <div className="mt-6 flex items-center gap-1.5">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  i < stageIndex ? "bg-indigo-500" : i === stageIndex ? "bg-indigo-400" : "bg-slate-800"
                }`}
              />
              <p
                className={`mt-1.5 text-center text-[10px] font-medium uppercase tracking-wide ${
                  i === stageIndex ? "text-indigo-300" : "text-slate-600"
                }`}
              >
                {STAGE_LABELS[s]}
              </p>
            </div>
          ))}
        </div>
      </header>

      <main>
        {state.stage === "setup" && <SetupStage dispatch={dispatch} dueCount={dueCount} />}
        {state.stage === "diagnose" && <DiagnoseStage state={state} dispatch={dispatch} />}
        {state.stage === "remediate" && <RemediateStage state={state} dispatch={dispatch} />}
        {state.stage === "teach" && <TeachStage state={state} dispatch={dispatch} />}
        {state.stage === "reinforce" && (
          <ReinforceStage state={state} dispatch={dispatch} onDeckChange={setDeck} />
        )}
        {state.stage === "review" && (
          <ReviewStage deck={deck} onDeckChange={setDeck} dispatch={dispatch} />
        )}
      </main>
    </div>
  );
}
