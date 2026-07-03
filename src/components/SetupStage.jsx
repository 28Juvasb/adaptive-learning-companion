import { useState } from "react";
import { Card, PrimaryButton, GhostButton, StageHeading } from "./ui.jsx";
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

  const canStart = topic.trim().length >= 2;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 1 of 6 · Setup"
        title="What do you want to learn today?"
        subtitle="Give me any topic — as broad or specific as you like. I'll check your foundations before teaching, and you can drop in your own notes, PDFs, or slides to ground everything."
        accent="text-emerald-600"
      />

      <Card className="border-emerald-200 bg-emerald-50/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) dispatch({ type: "SET_SETUP", topic, level, resources });
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
              placeholder="e.g. Photosynthesis, Recursion in Python, Supply and demand…"
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
