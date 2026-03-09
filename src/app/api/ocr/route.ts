/**
 * POST /api/ocr
 * Accepts FormData with an image file and returns extracted Devanagari text.
 *
 * Request: FormData with "image" field (JPEG or PNG, max 20MB)
 * Response: { text: string } on success
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/analysis/ocr";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    // Validate file exists and is a File object
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG and PNG are accepted" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 20MB limit" },
        { status: 400 }
      );
    }

    // Convert to Buffer and extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromImage(buffer);

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: "OCR extraction failed" },
      { status: 500 }
    );
  }
}
