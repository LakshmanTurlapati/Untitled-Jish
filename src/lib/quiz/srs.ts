import { createEmptyCard, FSRS, generatorParameters, Rating, State, type Card } from 'ts-fsrs';

const fsrs = new FSRS(generatorParameters());

export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

export function scheduleReview(card: Card, rating: Rating): Card {
  const result = fsrs.repeat(card, new Date());
  const entry = (result as unknown as Record<number, { card: Card }>)[rating];
  return entry.card;
}

export function isDue(dueDate: string | Date): boolean {
  return new Date(dueDate) <= new Date();
}

// Storable shape for IndexedDB (Date fields become ISO strings)
export interface StorableCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: State;
  last_review?: string;
}

// Serialize Card for IndexedDB storage (Date -> ISO string)
export function cardToStorable(card: Card): StorableCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

// Deserialize from IndexedDB back to Card (ISO string -> Date)
export function storableToCard(data: StorableCard): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsed_days,
    scheduled_days: data.scheduled_days,
    reps: data.reps,
    lapses: data.lapses,
    learning_steps: data.learning_steps,
    state: data.state,
    last_review: data.last_review ? new Date(data.last_review) : undefined,
  } as Card;
}

export { Rating, State } from 'ts-fsrs';
