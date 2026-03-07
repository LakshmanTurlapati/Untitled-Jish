import Sanscript from "@indic-transliteration/sanscript";

/**
 * Convert Devanagari text to IAST transliteration.
 */
export function devanagariToIast(text: string): string {
  if (!text) return "";
  return Sanscript.t(text, "devanagari", "iast");
}

/**
 * Convert IAST transliteration to Devanagari text.
 */
export function iastToDevanagari(text: string): string {
  if (!text) return "";
  return Sanscript.t(text, "iast", "devanagari");
}

/**
 * Convert SLP1 encoding to Devanagari text.
 * SLP1 is used internally by CDSL dictionaries.
 */
export function slp1ToDevanagari(text: string): string {
  if (!text) return "";
  return Sanscript.t(text, "slp1", "devanagari");
}

/**
 * Convert SLP1 encoding to IAST transliteration.
 */
export function slp1ToIast(text: string): string {
  if (!text) return "";
  return Sanscript.t(text, "slp1", "iast");
}
