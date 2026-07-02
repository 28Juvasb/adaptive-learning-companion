// SM-2-lite spaced repetition. Pure client-side, no LLM calls.

/**
 * Apply a review rating to a card and return the updated card.
 * quality: 1 (again) | 2 (hard) | 3 (good) | 4 (easy)
 */
export function reviewCard(card, quality) {
  let { interval = 0, ease = 2.5, repetitions = 0 } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);

    ease = Math.max(1.3, ease + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02)));
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    ...card,
    interval,
    ease,
    repetitions,
    dueDate: dueDate.toISOString(),
    lastReviewed: new Date().toISOString(),
  };
}

export function getDueCards(cards) {
  const now = new Date();
  return cards.filter((c) => !c.dueDate || new Date(c.dueDate) <= now);
}

export function nextDueDate(cards) {
  const future = cards
    .map((c) => new Date(c.dueDate))
    .filter((d) => !isNaN(d) && d > new Date())
    .sort((a, b) => a - b);
  return future[0] ?? null;
}
