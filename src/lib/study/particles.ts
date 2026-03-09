/**
 * Common Sanskrit particles (avyaya) that should be filtered
 * from vocabulary extraction -- they carry grammatical function
 * but are not meaningful vocabulary items for study.
 */
export const COMMON_PARTICLES = new Set<string>([
  "ca",
  "tu",
  "hi",
  "eva",
  "api",
  "iti",
  "atha",
  "tatha",
  "yatha",
  "na",
  "va",
  "iva",
  "aho",
  "kim",
  "tat",
  "yat",
  "sma",
  "ha",
  "vai",
  "khalu",
]);
