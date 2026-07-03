import { useState } from "react";
import { fetchFlashcards } from "../lib/prompts.js";
import { addCardsToDeck, removeCardsFromDeck } from "../lib/storage.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";
import AttachmentBar from "./AttachmentBar.jsx";

const COUNTS = [10, 15, 20];

// Collect everything the student got wrong this session into flashcard fodder.
function collectWeakConcepts(state) {
  const weak = [];
  for (const gap of state.gaps) {
    weak.push(`${gap.concept} (${gap.severity} prerequisite gap): ${gap.correction || gap.mini_lesson}`);
  }
  for (const result of state.checkResults ?? []) {
    if (!result.correct) {
      const q = state.lesson?.check_questions.find((x) => x.id === result.id);
      weak.push(`${result.concept_tag} (missed comprehension check): ${q?.text ?? ""} ${result.correction}`);
    }
  }
  return weak;
}

export default function ReinforceStage({ state, dispatch, onDeckChange }) {
  const { topic, level, sessionCards } = state;
  const [count, setCount] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generated = sessionCards.length > 0;
  const weakCount = collectWeakConcepts(state).length;

  async function generate(n) {
    setBusy(true);
    setError(null);
    try {
      // Regenerating? Remove the cards this session previously added first.
      if (sessionCards.length) {
        const ids = sessionCards.map((c) => c.id).filter(Boolean);
        if (ids.length) onDeckChange(removeCardsFromDeck(ids));
      }
      const cards = await fetchFlashcards({
        topic,
        level,
        weakConcepts: collectWeakConcepts(state),
        lessonSections: state.lesson?.lesson_sections ?? [],
        count: n,
      });
      const { deck, cards: stamped } = addCardsToDeck(cards, topic);
      onDeckChange(deck);
      dispatch({ type: "RECEIVE_CARDS", cards: stamped });
    } catch (err) {
      setError(err?.message ?? "Couldn't generate flashcards.");
    } finally {
      setBusy(false);
    }
  }

  if (busy) return <Spinner label={`Building ${count} flashcards from this session…`} tone="text-teal-500" />;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 5 of 6 · Reinforce"
        title={generated ? "Turned into flashcards" : "How many flashcards?"}
        subtitle={
          generated
            ? `${sessionCards.length} cards saved to your deck${
                weakCount > 0 ? `, covering the ${weakCount} thing${weakCount > 1 ? "s" : ""} you struggled with plus the lesson's key ideas` : ""
              }. Want more or fewer? Regenerate below.`
            : "Pick how thoroughly you want to lock this in. I'll cover every mistake, each lesson section, and the key terms."
        }
        accent="text-teal-600"
      />

      <AttachmentBar state={state} dispatch={dispatch} />

      {/* Count selector + generate / regenerate */}
      <Card className="mb-6 border-teal-200 bg-teal-50/70">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Cards:</span>
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition ${
                  count === n
                    ? "bg-teal-600 text-white"
                    : "border border-teal-200 bg-white text-slate-600 hover:border-teal-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <PrimaryButton onClick={() => generate(count)}>
            {generated ? `Regenerate ${count} cards` : `Generate ${count} flashcards →`}
          </PrimaryButton>
        </div>
      </Card>

      {error && (
        <div className="mb-6">
          <ErrorPanel message={error} onRetry={() => generate(count)} />
        </div>
      )}

      {generated && (
        <>
          <div className="mb-6 space-y-3">
            {sessionCards.map((c, i) => (
              <Card key={c.id ?? i} className="border-teal-200 bg-teal-50/70 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="teal">{c.concept_tag}</Badge>
                  <Badge>{c.difficulty}</Badge>
                </div>
                <p className="font-bold text-[#16202e]">{c.front}</p>
                <p className="mt-1 text-sm text-slate-500">{c.back}</p>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <PrimaryButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "review" })}>
              Start reviewing →
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
