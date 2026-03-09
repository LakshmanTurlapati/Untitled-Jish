import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRecognize, mockTerminate, mockCreateWorker } = vi.hoisted(() => {
  const mockRecognize = vi.fn();
  const mockTerminate = vi.fn();
  const mockCreateWorker = vi.fn();
  return { mockRecognize, mockTerminate, mockCreateWorker };
});

vi.mock("tesseract.js", () => ({
  createWorker: mockCreateWorker,
}));

import { extractTextFromImage } from "../analysis/ocr";

describe("extractTextFromImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    });
  });

  it("returns extracted Devanagari text from image buffer", async () => {
    mockRecognize.mockResolvedValue({
      data: { text: "धर्मक्षेत्रे कुरुक्षेत्रे" },
    });

    const buffer = Buffer.from("fake-image-data");
    const result = await extractTextFromImage(buffer);

    expect(result).toBe("धर्मक्षेत्रे कुरुक्षेत्रे");
    expect(mockCreateWorker).toHaveBeenCalledWith("script/Devanagari");
    expect(mockRecognize).toHaveBeenCalledWith(buffer);
  });

  it("trims whitespace from OCR output", async () => {
    mockRecognize.mockResolvedValue({
      data: { text: "  धर्मक्षेत्रे कुरुक्षेत्रे\n  " },
    });

    const buffer = Buffer.from("fake-image-data");
    const result = await extractTextFromImage(buffer);

    expect(result).toBe("धर्मक्षेत्रे कुरुक्षेत्रे");
  });

  it("handles empty OCR result gracefully (returns empty string)", async () => {
    mockRecognize.mockResolvedValue({
      data: { text: "" },
    });

    const buffer = Buffer.from("fake-image-data");
    const result = await extractTextFromImage(buffer);

    expect(result).toBe("");
  });

  it("throws on Tesseract worker failure", async () => {
    mockRecognize.mockRejectedValue(new Error("Tesseract worker crashed"));

    const buffer = Buffer.from("fake-image-data");
    await expect(extractTextFromImage(buffer)).rejects.toThrow(
      "Tesseract worker crashed"
    );
  });

  it("always calls worker.terminate even on error", async () => {
    mockRecognize.mockRejectedValue(new Error("OCR failed"));

    const buffer = Buffer.from("fake-image-data");
    try {
      await extractTextFromImage(buffer);
    } catch {
      // expected
    }

    expect(mockTerminate).toHaveBeenCalled();
  });
});
