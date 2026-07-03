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

/**
 * Add freshly generated cards to the persistent deck (due immediately).
 * Returns { deck, cards } — `cards` are the stamped cards (with ids) so the
 * caller can track exactly which cards this session added (for regenerate).
 */
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
  return { deck: merged, cards: stamped };
}

/** Remove cards by id (used when regenerating a session's deck). */
export function removeCardsFromDeck(ids) {
  const set = new Set(ids);
  const deck = loadDeck().filter((c) => !set.has(c.id));
  saveDeck(deck);
  return deck;
}

export function updateCardInDeck(updatedCard) {
  const deck = loadDeck().map((c) => (c.id === updatedCard.id ? updatedCard : c));
  saveDeck(deck);
  return deck;
}
