import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExtractTextFromImage } = vi.hoisted(() => {
  const mockExtractTextFromImage = vi.fn();
  return { mockExtractTextFromImage };
});

vi.mock("@/lib/analysis/ocr", () => ({
  extractTextFromImage: mockExtractTextFromImage,
}));

import { POST } from "@/app/api/ocr/route";
import { NextRequest } from "next/server";

function createMockRequest(file?: File): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append("image", file);
  }
  return new NextRequest("http://localhost:3000/api/ocr", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/ocr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no image file in FormData", async () => {
    const request = createMockRequest();
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when file type is not JPEG or PNG", async () => {
    const file = new File([new Uint8Array(10)], "test.gif", {
      type: "image/gif",
    });
    const request = createMockRequest(file);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/type/i);
  });

  it("returns 400 when file exceeds 20MB", async () => {
    // Create a file just over 20MB
    const size = 20 * 1024 * 1024 + 1;
    const file = new File([new Uint8Array(size)], "large.jpg", {
      type: "image/jpeg",
    });
    const request = createMockRequest(file);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/size/i);
  });

  it("returns 200 with extracted text on valid image upload", async () => {
    mockExtractTextFromImage.mockResolvedValue("धर्मक्षेत्रे कुरुक्षेत्रे");

    const file = new File([new Uint8Array(10)], "test.jpg", {
      type: "image/jpeg",
    });
    const request = createMockRequest(file);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe("धर्मक्षेत्रे कुरुक्षेत्रे");
    expect(mockExtractTextFromImage).toHaveBeenCalled();
  });

  it("returns 500 with error message when OCR extraction fails", async () => {
    mockExtractTextFromImage.mockRejectedValue(new Error("OCR engine error"));

    const file = new File([new Uint8Array(10)], "test.png", {
      type: "image/png",
    });
    const request = createMockRequest(file);
    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("OCR extraction failed");
  });
});
