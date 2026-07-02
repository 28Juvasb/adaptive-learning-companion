import { useState, useMemo } from "react";
import { reviewCard, getDueCards, nextDueDate } from "../lib/srs.js";
import { updateCardInDeck } from "../lib/storage.js";
import { Card, PrimaryButton, GhostButton, Badge, StageHeading } from "./ui.jsx";

const RATINGS = [
  { quality: 1, label: "Again", tone: "bg-rose-600 hover:bg-rose-500" },
  { quality: 2, label: "Hard", tone: "bg-amber-600 hover:bg-amber-500" },
  { quality: 3, label: "Good", tone: "bg-emerald-600 hover:bg-emerald-500" },
  { quality: 4, label: "Easy", tone: "bg-indigo-600 hover:bg-indigo-500" },
];

export default function ReviewStage({ deck, onDeckChange, dispatch }) {
  // Snapshot the due queue when the stage opens so rating "Again" (due tomorrow)
  // doesn't mutate the queue mid-session.
  const [queue, setQueue] = useState(() => getDueCards(deck).map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = useMemo(
    () => deck.find((c) => c.id === queue[0]),
    [deck, queue]
  );

  function rate(quality) {
    const updated = reviewCard(currentCard, quality);
    const newDeck = updateCardInDeck(updated);
    onDeckChange(newDeck);
    setQueue((q) => q.slice(1));
    setFlipped(false);
    setReviewedCount((n) => n + 1);
  }

  if (!currentCard) {
    const next = nextDueDate(deck);
    return (
      <div className="mx-auto max-w-xl text-center">
        <StageHeading
          kicker="Review"
          title={reviewedCount > 0 ? `Session complete — ${reviewedCount} cards reviewed 🎉` : "Nothing due right now"}
          subtitle={
            deck.length === 0
              ? "Your deck is empty. Finish a learning session to generate flashcards."
              : next
                ? `Your deck has ${deck.length} cards. Next review due ${next.toLocaleDateString()} — spaced repetition works best when you come back then.`
                : `Your deck has ${deck.length} cards, all reviewed.`
          }
        />
        <div className="flex justify-center gap-3">
          <PrimaryButton onClick={() => dispatch({ type: "RESET_SESSION" })}>
            Learn a new topic →
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <StageHeading
        kicker="Review · spaced repetition"
        title={`${queue.length} card${queue.length > 1 ? "s" : ""} due`}
        subtitle="Click the card to reveal the answer, then rate how well you knew it. Your rating sets when you'll see it again."
      />

      <div
        className={`perspective mb-6 cursor-pointer ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flip-inner relative min-h-56">
          <Card className="flip-face absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex gap-2">
              <Badge tone="indigo">{currentCard.concept_tag}</Badge>
              <Badge>{currentCard.topic}</Badge>
            </div>
            <p className="text-lg font-medium text-slate-100">{currentCard.front}</p>
            <p className="mt-4 text-xs text-slate-500">click to reveal</p>
          </Card>
          <Card className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center border-indigo-800/60 text-center">
            <p className="text-lg text-slate-100">{currentCard.back}</p>
          </Card>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.quality}
              onClick={() => rate(r.quality)}
              className={`rounded-xl px-3 py-2.5 font-semibold text-white transition ${r.tone}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex justify-center">
          <GhostButton onClick={() => setFlipped(true)}>Show answer</GhostButton>
        </div>
      )}
    </div>
  );
}
