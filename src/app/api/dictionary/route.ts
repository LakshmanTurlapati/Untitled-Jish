import { NextRequest, NextResponse } from "next/server";
import {
  lookupByHeadword,
  lookupByStem,
  searchEntries,
} from "@/lib/dictionary/lookup";

/**
 * GET /api/dictionary
 *
 * Query parameters:
 *   q      - required: search query
 *   script - optional: 'iast' (default), 'deva', 'slp1'
 *   mode   - optional: 'headword' (default), 'stem', 'search'
 *   limit  - optional: max results for search mode (default 20)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const script = (searchParams.get("script") || "iast") as
    | "iast"
    | "deva"
    | "slp1";
  const mode = searchParams.get("mode") || "headword";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  // Validate script parameter
  if (!["iast", "deva", "slp1"].includes(script)) {
    return NextResponse.json(
      { error: "Invalid script parameter. Use: iast, deva, slp1" },
      { status: 400 }
    );
  }

  try {
    switch (mode) {
      case "headword": {
        const entries = lookupByHeadword(q, script);
        return NextResponse.json(entries);
      }
      case "stem": {
        const result = lookupByStem(q, script);
        return NextResponse.json(result);
      }
      case "search": {
        const entries = searchEntries(q, limit);
        return NextResponse.json(entries);
      }
      default:
        return NextResponse.json(
          { error: "Invalid mode parameter. Use: headword, stem, search" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
