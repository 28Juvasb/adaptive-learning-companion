// Flashcard deck persistence in localStorage.

const DECK_KEY = "alc_flashcards";

export function loadDeck() {
  try {
    const raw = localStorage.getItem(DECK_KEY);
    const deck = raw ? JSON.parse(raw) : [];
    return Array.isArray(deck) ? deck : [];
  } catch {
    return [];
  }
}

export function saveDeck(deck) {
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify(deck));
  } catch (err) {
    console.warn("Failed to persist deck:", err);
  }
}

/** Add freshly generated cards to the persistent deck (due immediately). */
export function addCardsToDeck(newCards, topic) {
  const deck = loadDeck();
  const stamped = newCards.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    topic,
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }));
  const merged = [...deck, ...stamped];
  saveDeck(merged);
  return merged;
}

export function updateCardInDeck(updatedCard) {
  const deck = loadDeck().map((c) => (c.id === updatedCard.id ? updatedCard : c));
  saveDeck(deck);
  return deck;
}
