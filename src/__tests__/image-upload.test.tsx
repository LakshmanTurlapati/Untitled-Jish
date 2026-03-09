// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUpload } from "@/app/components/ImageUpload";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ImageUpload component", () => {
  it("renders file input accepting JPEG and PNG", () => {
    render(<ImageUpload onTextExtracted={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe("image/jpeg,image/png");
  });

  it("shows error for unsupported file types", async () => {
    render(<ImageUpload onTextExtracted={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["hello"], "test.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [badFile] } });
    await waitFor(() => {
      expect(screen.getByText(/unsupported|invalid|only.*jpeg.*png/i)).toBeInTheDocument();
    });
  });

  it("calls onTextExtracted with OCR result on successful upload", async () => {
    const mockCallback = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: "\u0927\u0930\u094D\u092E\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947" }),
      })
    );
    // Mock URL.createObjectURL
    vi.stubGlobal("URL", { ...globalThis.URL, createObjectURL: vi.fn(() => "blob:mock") });

    render(<ImageUpload onTextExtracted={mockCallback} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-data"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith("\u0927\u0930\u094D\u092E\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0947");
    });
  });

  it("shows loading state during upload", async () => {
    let resolveUpload!: (value: unknown) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(uploadPromise)
    );
    vi.stubGlobal("URL", { ...globalThis.URL, createObjectURL: vi.fn(() => "blob:mock") });

    render(<ImageUpload onTextExtracted={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-data"], "test.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/extracting/i)).toBeInTheDocument();
    });

    // Resolve to clean up
    resolveUpload({ ok: true, json: () => Promise.resolve({ text: "test" }) });
  });

  it("shows error message on upload failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "OCR processing failed" }),
      })
    );
    vi.stubGlobal("URL", { ...globalThis.URL, createObjectURL: vi.fn(() => "blob:mock") });

    render(<ImageUpload onTextExtracted={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-data"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });
});
