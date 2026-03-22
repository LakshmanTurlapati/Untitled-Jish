/**
 * OCR extraction using Tesseract.js for Devanagari text.
 * Uses local Tesseract.js worker -- no external API needed.
 */

import { createWorker } from "tesseract.js";

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 * Uses the Sanskrit (san) trained data for Devanagari text recognition.
 * Includes a 30-second timeout to prevent indefinite hanging.
 *
 * @param imageBuffer - Raw image data as a Buffer (JPEG or PNG)
 * @returns Extracted text, trimmed of leading/trailing whitespace
 * @throws Error if OCR times out after 30 seconds or worker fails
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string> {
  const worker = await createWorker("san");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const abortPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(
          new Error(
            "OCR timed out after 30 seconds. Try a clearer image or paste text directly."
          )
        );
      });
    });

    const result = await Promise.race([
      worker.recognize(imageBuffer),
      abortPromise,
    ]);

    return result.data.text.trim();
  } finally {
    clearTimeout(timeoutId);
    controller.abort();
    await worker.terminate();
  }
}
