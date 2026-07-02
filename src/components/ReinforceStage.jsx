import { fetchFlashcards } from "../lib/prompts.js";
import { useStageFetch } from "../lib/useStageFetch.js";
import { addCardsToDeck } from "../lib/storage.js";
import { Card, PrimaryButton, Spinner, ErrorPanel, Badge, StageHeading } from "./ui.jsx";

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

  const { loading, error, retry } = useStageFetch(
    async () => {
      const weakConcepts = collectWeakConcepts(state);
      const cards = await fetchFlashcards({ topic, level, weakConcepts });
      const deck = addCardsToDeck(cards, topic);
      onDeckChange(deck);
      dispatch({ type: "RECEIVE_CARDS", cards });
    },
    { skip: sessionCards.length > 0 }
  );

  if (loading) return <Spinner label="Converting your mistakes into flashcards…" />;
  if (error) return <ErrorPanel message={error} onRetry={retry} />;

  const weakCount = collectWeakConcepts(state).length;

  return (
    <div className="mx-auto max-w-2xl">
      <StageHeading
        kicker="Step 5 of 5 · Reinforce"
        title={`${sessionCards.length} flashcards created`}
        subtitle={
          weakCount > 0
            ? `Built from the ${weakCount} concept${weakCount > 1 ? "s" : ""} you struggled with, plus the topic's core ideas. They're saved to your deck and scheduled for spaced review.`
            : "No mistakes this session, so these cover the topic's core ideas. They're saved to your deck and scheduled for spaced review."
        }
      />

      <div className="mb-6 space-y-3">
        {sessionCards.map((c, i) => (
          <Card key={i} className="py-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="indigo">{c.concept_tag}</Badge>
              <Badge>{c.difficulty}</Badge>
            </div>
            <p className="font-medium text-slate-100">{c.front}</p>
            <p className="mt-1 text-sm text-slate-400">{c.back}</p>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={() => dispatch({ type: "GO_TO_STAGE", stage: "review" })}>
          Start reviewing →
        </PrimaryButton>
      </div>
    </div>
  );
}
