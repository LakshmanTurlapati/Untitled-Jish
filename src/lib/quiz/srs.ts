import { createEmptyCard, FSRS, Rating, State, type Card } from 'ts-fsrs';

const fsrs = new FSRS();

export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

export function scheduleReview(card: Card, rating: Rating): Card {
  const result = fsrs.repeat(card, new Date());
  return result[rating].card;
}

export function isDue(dueDate: string | Date): boolean {
  return new Date(dueDate) <= new Date();
}

// Serialize Card for IndexedDB storage (Date -> ISO string)
export function cardToStorable(card: Card): {
  due: string; stability: number; difficulty: number;
  elapsed_days: number; scheduled_days: number;
  reps: number; lapses: number; state: State; last_review?: string;
} {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

// Deserialize from IndexedDB back to Card (ISO string -> Date)
export function storableToCard(data: {
  due: string; stability: number; difficulty: number;
  elapsed_days: number; scheduled_days: number;
  reps: number; lapses: number; state: State; last_review?: string;
}): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsed_days,
    scheduled_days: data.scheduled_days,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    last_review: data.last_review ? new Date(data.last_review) : undefined as unknown as Date,
  };
}

export { Rating, State } from 'ts-fsrs';
