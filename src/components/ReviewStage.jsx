import { useState, useMemo } from "react";
import { reviewCard, getDueCards, nextDueDate } from "../lib/srs.js";
import { updateCardInDeck } from "../lib/storage.js";
import { Card, PrimaryButton, Badge, StageHeading } from "./ui.jsx";

const RATINGS = [
  { quality: 1, label: "Again", tone: "bg-rose-500 hover:bg-rose-400" },
  { quality: 2, label: "Hard", tone: "bg-orange-500 hover:bg-orange-400" },
  { quality: 3, label: "Good", tone: "bg-emerald-500 hover:bg-emerald-400" },
  { quality: 4, label: "Easy", tone: "bg-sky-500 hover:bg-sky-400" },
];

export default function ReviewStage({ deck, onDeckChange, dispatch }) {
  // Snapshot the due queue when the stage opens so rating "Again" doesn't
  // re-order the queue mid-session.
  const [queue, setQueue] = useState(() => getDueCards(deck).map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = useMemo(() => deck.find((c) => c.id === queue[0]), [deck, queue]);
  const total = reviewedCount + queue.length;

  function rate(quality) {
    const updated = reviewCard(currentCard, quality);
    onDeckChange(updateCardInDeck(updated));
    setQueue((q) => q.slice(1));
    setFlipped(false);
    setReviewedCount((n) => n + 1);
  }

  if (!currentCard) {
    const next = nextDueDate(deck);
    return (
      <div className="mx-auto max-w-xl text-center">
        <StageHeading
          kicker="Step 6 of 6 · Review"
          title={reviewedCount > 0 ? `Session complete — ${reviewedCount} cards reviewed 🎉` : "Nothing due right now"}
          subtitle={
            deck.length === 0
              ? "Your deck is empty. Finish a learning session to generate flashcards."
              : next
                ? `Your deck has ${deck.length} cards. Next review due ${next.toLocaleDateString()} — spaced repetition works best when you come back then.`
                : `Your deck has ${deck.length} cards, all reviewed.`
          }
          accent="text-sky-600"
        />
        <div className="flex justify-center">
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
        kicker="Step 6 of 6 · Review"
        title="Quick review"
        subtitle="Click the card to reveal the answer, then rate how well you knew it. Your rating sets when you'll see it again."
        accent="text-sky-600"
      />

      <p className="mb-3 text-center text-sm font-medium text-slate-500">
        Card {reviewedCount + 1} of {total}
      </p>

      <div
        className={`perspective mb-6 cursor-pointer ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flip-inner relative min-h-56">
          <Card className="flip-face absolute inset-0 flex flex-col items-center justify-center border-sky-200 bg-sky-50 text-center">
            <div className="mb-3 flex gap-2">
              <Badge tone="blue">{currentCard.concept_tag}</Badge>
              <Badge>{currentCard.topic}</Badge>
            </div>
            <p className="text-lg font-bold text-[#16202e]">{currentCard.front}</p>
            <p className="mt-4 text-xs text-slate-400">click to reveal</p>
          </Card>
          <Card className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center border-sky-300 bg-white text-center">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-sky-600">Answer</p>
            <p className="text-lg text-[#16202e]">{currentCard.back}</p>
          </Card>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.quality}
              onClick={() => rate(r.quality)}
              className={`rounded-xl px-3 py-2.5 font-bold text-white transition ${r.tone}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex justify-center">
          <PrimaryButton onClick={() => setFlipped(true)}>Show answer</PrimaryButton>
        </div>
      )}
    </div>
  );
}
