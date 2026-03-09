/**
 * GET /api/distractors - Fallback distractor meanings from MW dictionary.
 *
 * Query params:
 *   count - number of random meanings to return (default 3, max 10)
 *
 * Returns: { meanings: string[] }
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/dictionary/db";

const MAX_COUNT = 10;
const DEFAULT_COUNT = 3;
const TRUNCATE_AT = 80;

/**
 * Truncate a definition to a readable snippet:
 * - If a comma exists within 80 chars, cut there
 * - Otherwise take first 80 chars
 */
function truncateDefinition(def: string): string {
  const commaIdx = def.indexOf(",");
  if (commaIdx > 0 && commaIdx <= TRUNCATE_AT) {
    return def.substring(0, commaIdx).trim();
  }
  if (def.length <= TRUNCATE_AT) {
    return def;
  }
  return def.substring(0, TRUNCATE_AT).trim();
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const countParam = url.searchParams.get("count");
  const count = Math.min(
    Math.max(1, parseInt(countParam ?? String(DEFAULT_COUNT), 10) || DEFAULT_COUNT),
    MAX_COUNT
  );

  try {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT definition FROM entries WHERE dictionary = 'mw' AND definition != '' ORDER BY RANDOM() LIMIT ?"
      )
      .all(count) as { definition: string }[];

    const meanings = rows.map((r) => truncateDefinition(r.definition));

    return NextResponse.json({ meanings });
  } catch (error) {
    console.error("Distractors API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch distractors" },
      { status: 500 }
    );
  }
}
