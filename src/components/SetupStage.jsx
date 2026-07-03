import { useState } from "react";
import { fetchSubtopics } from "../lib/prompts.js";
import { groundingText } from "../state/sessionReducer.js";
import { Card, PrimaryButton, GhostButton, Spinner, ErrorPanel, StageHeading } from "./ui.jsx";
import FileDropzone from "./FileDropzone.jsx";

const LEVELS = [
  "Primary school",
  "Middle school",
  "High school",
  "Competitive exam prep",
  "College / undergraduate",
  "Adult self-learner",
  "Professional / on the job",
];

export default function SetupStage({ state, dispatch, dueCount }) {
  const [topic, setTopic] = useState(state.topic || "");
  const [level, setLevel] = useState(state.level || "High school");
  const [resources, setResources] = useState(state.resources || "");

  // phase: 'form' → collect topic; 'scoping' → checking breadth; 'choosing' → pick a subtopic
  const [phase, setPhase] = useState("form");
  const [subtopics, setSubtopics] = useState([]);
  const [error, setError] = useState(null);

  const canStart = topic.trim().length >= 2;

  function start(focusTopic) {
    dispatch({
      type: "SET_SETUP",
      topic: focusTopic,
      broadTopic: topic,
      level,
      resources,
    });
  }

  async function handleSubmit() {
    if (!canStart) return;
    setPhase("scoping");
    setError(null);
    try {
      const { is_broad, subtopics } = await fetchSubtopics({
        topic,
        level,
        resources: groundingText({ ...state, resources }),
      });
      if (is_broad && subtopics.length >= 2) {
        setSubtopics(subtopics);
        setPhase("choosing");
      } else {
        start(topic); // narrow enough — go straight in
      }
    } catch (err) {
      setError(err?.message ?? "Couldn't plan the topic.");
      setPhase("form");
    }
  }

  if (phase === "scoping") {
    return <Spinner label={`Checking how big "${topic}" is…`} tone="text-emerald-500" />;
  }

  if (phase === "choosing") {
    return (
      <div className="mx-auto max-w-2xl">
        <StageHeading
          kicker="Step 1 of 6 · Focus"
          title="That's a big topic — let's focus"
          subtitle={`"${topic}" is too broad to master well in one sitting. Pick one focused area to go deep on now — you can come back for the others. Each becomes its own diagnose → teach → flashcards session.`}
          accent="text-emerald-600"
        />
        <div className="space-y-3">
          {subtopics.map((s, i) => (
            <button
              key={i}
              onClick={() => start(s.title)}
              className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <p className="font-bold text-[#16202e]">{s.title}</p>
              {s.blurb && <p className="mt-1 text-sm text-slate-600">{s.blurb}</p>}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <GhostButton onClick={() => setPhase("form")}>← Change topic</GhostButton>
          <GhostButton onClick={() => start(topic)}>Study the whole thing anyway →</GhostButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 1 of 6 · Setup"
        title="What do you want to learn today?"
        subtitle="Give me any topic — broad or specific. I'll check your foundations before teaching, and you can drop in your own notes, PDFs, or slides to ground everything. Big topics get broken into focused sessions."
        accent="text-emerald-600"
      />

      {error && (
        <div className="mb-4">
          <ErrorPanel message={error} onRetry={handleSubmit} />
        </div>
      )}

      <Card className="border-emerald-200 bg-emerald-50/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="topic" className="mb-1.5 block text-sm font-bold text-slate-700">
              Topic <span className="text-rose-500">*</span>
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Recursion in Python, Calculus…"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm font-bold text-slate-700">
              Your level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="resources" className="mb-1.5 block text-sm font-bold text-slate-700">
              Study material <span className="font-medium text-slate-400">(optional)</span>
            </label>
            <textarea
              id="resources"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              rows={3}
              placeholder="Paste notes or textbook text…"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
            />
            <div className="mt-3">
              <FileDropzone
                attachments={state.attachments}
                onAdd={(a) => dispatch({ type: "ADD_ATTACHMENT", attachment: a })}
                onRemove={(name) => dispatch({ type: "REMOVE_ATTACHMENT", name })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <PrimaryButton type="submit" disabled={!canStart}>
              Start learning →
            </PrimaryButton>
            {dueCount > 0 && (
              <GhostButton type="button" onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "review" })}>
                Review flashcards ({dueCount} due)
              </GhostButton>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
