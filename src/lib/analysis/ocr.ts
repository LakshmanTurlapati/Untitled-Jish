/**
 * OCR extraction using Tesseract.js for Devanagari text.
 * Uses local Tesseract.js worker -- no external API needed.
 */

import { createWorker } from "tesseract.js";

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 * Uses the Devanagari script trained data for Sanskrit text recognition.
 *
 * @param imageBuffer - Raw image data as a Buffer (JPEG or PNG)
 * @returns Extracted text, trimmed of leading/trailing whitespace
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string> {
  const worker = await createWorker("script/Devanagari");
  try {
    const result = await worker.recognize(imageBuffer);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}
