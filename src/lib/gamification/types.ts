export const XP_VALUES = {
  quizCorrect: 10,
  quizStreak3: 5,
  quizStreak5: 10,
  kaavyaComplete: 100,
} as const;

export interface RankTier {
  name: string;
  sanskritName: string;
  minMastered: number;
  minKaavyas: number;
  color: string; // Tailwind text color class
}

export const RANK_TIERS: RankTier[] = [
  { name: "Beginner",   sanskritName: "Shishya",    minMastered: 0,   minKaavyas: 0, color: "text-ink-600" },
  { name: "Learner",    sanskritName: "Adhyayin",   minMastered: 10,  minKaavyas: 0, color: "text-blue-500" },
  { name: "Scholar",    sanskritName: "Vidvan",     minMastered: 50,  minKaavyas: 1, color: "text-green-500" },
  { name: "Pandit",     sanskritName: "Pandit",     minMastered: 100, minKaavyas: 2, color: "text-accent-500" },
  { name: "Acharya",    sanskritName: "Acharya",    minMastered: 250, minKaavyas: 3, color: "text-purple-500" },
  { name: "Mahavidvan", sanskritName: "Mahavidvan", minMastered: 500, minKaavyas: 5, color: "text-amber-500" },
];

export interface UserStats {
  id?: number;
  totalXP: number;
  lastRankName: string; // For detecting rank-up
}

export interface ForgettingCurvePoint {
  day: number;
  retrievability: number; // 0-100 percentage
}

export interface GrowthDataPoint {
  date: string; // YYYY-MM-DD
  newCount: number;
  learning: number;
  mastered: number;
  total: number;
}

export interface ComprehensionMetric {
  kaavyaId: number;
  kaavyaTitle: string;
  totalShlokas: number; // Estimated from text length
  explored: number;     // ShlokaInterpretation count
  hintRatio: number;    // avg hints per interpretation
}
