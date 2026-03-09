/**
 * LLM prompt templates for Sanskrit text analysis.
 * Used with Grok via the Vercel AI SDK for structured output generation.
 */

/**
 * Build a comprehensive analysis prompt for a Sanskrit text passage.
 * Instructs the LLM to perform sandhi splitting, samasa decomposition,
 * morphological analysis, and contextual meaning extraction.
 *
 * @param text - Sanskrit text in Devanagari script
 * @returns Formatted prompt string
 */
export function buildAnalysisPrompt(text: string): string {
  return `You are an expert Sanskrit grammarian (vaiyakarana) with deep knowledge of Paninian grammar. Analyze the following Sanskrit text with precision and scholarly rigor. Provide deterministic, consistent output.

INPUT TEXT: ${text}

Perform the following analyses for each word:

1. SANDHI SPLITTING
Split all sandhi junctions into individual words. For each junction, identify:
- The sandhi type: vowel, consonant, or visarga
- The specific sandhi rule applied

Common sandhi examples:
- Vowel sandhi (svara-sandhi): a + i = e, a + u = o, a + a = ā, i + vowel = y + vowel, u + vowel = v + vowel
- Consonant sandhi (vyanjana-sandhi): final stop + initial consonant transformations (e.g., t + j = jj, t + d = dd, t + n = nn)
- Visarga sandhi: aḥ + vowel = a + vowel (with visarga dropping), aḥ + voiced consonant = o, aḥ + sibilant = various

If no sandhi applies to a word boundary, mark it as "none".

2. SAMASA (COMPOUND) DECOMPOSITION
For each compound word, decompose it and classify using one of:
- tatpurusha (determinative compound): the first member qualifies the second
- dvandva (copulative compound): both members are coordinated
- bahuvrihi (possessive/exocentric compound): the compound refers to something external
- avyayibhava (adverbial compound): the compound functions as an indeclinable
- karmadharaya (descriptive compound): appositional, first member describes second
- dvigu (numerical compound): first member is a numeral

List all component words with their individual meanings and roles.

3. MORPHOLOGICAL ANALYSIS
For each word, provide:
- The stem (pratipadika for nominals, dhatu for verbs)
- Word type: noun, verb, adjective, indeclinable, participle, or pronoun

For nominals (nouns, adjectives, pronouns):
- vibhakti (case): prathamā, dvitīyā, tṛtīyā, caturthī, pañcamī, ṣaṣṭhī, saptamī, sambodhana
- vacana (number): ekavacana, dvivacana, bahuvacana
- linga (gender): pullinga, strilinga, napumsakalinga

For verbs:
- dhatu (root)
- gana (class, 1-10)
- lakara (tense/mood): laṭ, liṭ, luṭ, lṛṭ, leṭ, loṭ, laṅ, liṅ, luṅ, lṛṅ
- purusha (person): prathama, madhyama, uttama
- vacana (number)

4. CONTEXTUAL MEANING
Provide the specific meaning of each word as used in THIS passage context, not just the general dictionary meaning.

IMPORTANT:
- Use IAST transliteration for all Sanskrit terms in your analysis.
- Be precise with grammatical terminology.
- For compound words, set is_compound to true and provide samasa details.
- For non-compound words, set is_compound to false.`;
}
