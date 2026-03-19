import { describe, it, expect } from 'vitest';
import {
  createNewCard,
  scheduleReview,
  isDue,
  cardToStorable,
  storableToCard,
  Rating,
  State,
} from '@/lib/quiz/srs';

describe('SRS wrapper', () => {
  describe('createNewCard', () => {
    it('returns a card with state=New', () => {
      const card = createNewCard();
      expect(card.state).toBe(State.New);
    });

    it('returns a card with due <= now', () => {
      const card = createNewCard();
      expect(card.due.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('scheduleReview', () => {
    it('returns card with state !== New after Rating.Good', () => {
      const card = createNewCard();
      const reviewed = scheduleReview(card, Rating.Good);
      expect(reviewed.state).not.toBe(State.New);
    });

    it('Rating.Again returns card with lower stability than Rating.Good', () => {
      const card = createNewCard();
      const again = scheduleReview(card, Rating.Again);
      const good = scheduleReview(card, Rating.Good);
      expect(again.stability).toBeLessThan(good.stability);
    });

    it('returns card with due > now after Rating.Good', () => {
      const card = createNewCard();
      const reviewed = scheduleReview(card, Rating.Good);
      expect(reviewed.due.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('isDue', () => {
    it('returns true when due date is in the past', () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      expect(isDue(pastDate)).toBe(true);
    });

    it('returns false when due date is in the future', () => {
      const futureDate = new Date(Date.now() + 60_000).toISOString();
      expect(isDue(futureDate)).toBe(false);
    });

    it('works with Date objects too', () => {
      const pastDate = new Date(Date.now() - 60_000);
      expect(isDue(pastDate)).toBe(true);
    });
  });

  describe('cardToStorable', () => {
    it('converts Date objects to ISO strings', () => {
      const card = createNewCard();
      const storable = cardToStorable(card);
      expect(typeof storable.due).toBe('string');
      expect(storable.due).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('preserves all numeric fields', () => {
      const card = createNewCard();
      const storable = cardToStorable(card);
      expect(typeof storable.stability).toBe('number');
      expect(typeof storable.difficulty).toBe('number');
      expect(typeof storable.elapsed_days).toBe('number');
      expect(typeof storable.scheduled_days).toBe('number');
      expect(typeof storable.reps).toBe('number');
      expect(typeof storable.lapses).toBe('number');
    });
  });

  describe('storableToCard', () => {
    it('converts ISO strings back to Date objects', () => {
      const card = createNewCard();
      const storable = cardToStorable(card);
      const restored = storableToCard(storable);
      expect(restored.due).toBeInstanceOf(Date);
    });

    it('round-trips correctly', () => {
      const card = createNewCard();
      const storable = cardToStorable(card);
      const restored = storableToCard(storable);
      expect(restored.due.getTime()).toBe(card.due.getTime());
      expect(restored.stability).toBe(card.stability);
      expect(restored.difficulty).toBe(card.difficulty);
      expect(restored.state).toBe(card.state);
    });
  });
});
