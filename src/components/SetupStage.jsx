import { useState } from "react";
import { Card, PrimaryButton, GhostButton, StageHeading } from "./ui.jsx";

const LEVELS = [
  "Primary school",
  "Middle school",
  "High school",
  "Competitive exam prep",
  "College / undergraduate",
  "Adult self-learner",
];

export default function SetupStage({ dispatch, dueCount }) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("High school");
  const [resources, setResources] = useState("");

  const canStart = topic.trim().length >= 2;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 1 of 5 · Intake"
        title="What do you want to learn?"
        subtitle="Before teaching anything, I'll check the foundations it's built on."
      />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) dispatch({ type: "SET_SETUP", topic, level, resources });
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-slate-300">
              Topic <span className="text-rose-400">*</span>
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Quadratic equations, Supply and demand…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-slate-300">
              Your level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none focus:border-indigo-500"
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="resources" className="mb-1.5 block text-sm font-medium text-slate-300">
              Study material <span className="text-slate-500">(optional — paste notes or textbook text to ground the lesson)</span>
            </label>
            <textarea
              id="resources"
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              rows={5}
              placeholder="Paste any text you want the tutor to teach from…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <PrimaryButton type="submit" disabled={!canStart}>
              Start diagnosis →
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
