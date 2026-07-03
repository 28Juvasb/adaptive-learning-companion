import { useReducer, useState } from "react";
import { sessionReducer, initialState } from "./state/sessionReducer.js";
import { STAGE_ORDER, STAGE_THEME } from "./lib/theme.js";
import { loadDeck } from "./lib/storage.js";
import { getDueCards } from "./lib/srs.js";
import { isDemoMode } from "./lib/openrouter.js";
import SetupStage from "./components/SetupStage.jsx";
import DiagnoseStage from "./components/DiagnoseStage.jsx";
import RemediateStage from "./components/RemediateStage.jsx";
import TeachStage from "./components/TeachStage.jsx";
import ReinforceStage from "./components/ReinforceStage.jsx";
import ReviewStage from "./components/ReviewStage.jsx";

function Logo({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 text-left" title="Start over">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#16202e]">
        <span className="h-4 w-4 rotate-45 rounded-[3px] bg-[#34e0a1]" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-[#16202e]">
        Adaptive Learning Companion
      </span>
    </button>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [deck, setDeck] = useState(loadDeck);

  const dueCount = getDueCards(deck).length;
  const stageIndex = STAGE_ORDER.indexOf(state.stage);

  return (
    <div className="min-h-screen px-4 pb-24 pt-6">
      <header className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-5">
          <Logo onClick={() => dispatch({ type: "RESET_SESSION" })} />
          {state.topic && (
            <div className="rounded-xl border border-amber-200 bg-amber-100/70 px-4 py-1.5 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">Studying</p>
              <p className="font-bold leading-tight text-[#16202e]">{state.topic}</p>
              {state.broadTopic && state.broadTopic !== state.topic && (
                <p className="text-[11px] text-amber-700/70">part of {state.broadTopic}</p>
              )}
            </div>
          )}
        </div>

        {isDemoMode && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            <strong>Demo mode:</strong> no API key found — showing canned responses. Add your OpenRouter
            key to <code className="font-mono">.env.local</code> and restart for live AI tutoring.
          </div>
        )}

        {/* Multi-color stage progress bar — each completed stage keeps its own accent */}
        <div className="mt-6 grid grid-cols-6 gap-2">
          {STAGE_ORDER.map((s, i) => {
            const done = i <= stageIndex;
            const theme = STAGE_THEME[s];
            return (
              <div key={s}>
                <div className={`h-2 rounded-full ${done ? theme.bar : "bg-black/10"}`} />
                <p
                  className={`mt-1.5 text-center text-[10px] font-bold uppercase tracking-wide ${
                    i === stageIndex ? theme.accent : "text-slate-400"
                  }`}
                >
                  {theme.label}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      <main className="mt-10">
        {state.stage === "setup" && <SetupStage state={state} dispatch={dispatch} dueCount={dueCount} />}
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
