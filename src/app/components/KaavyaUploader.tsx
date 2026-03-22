"use client";

import { useState, useRef } from "react";
import { FaFilePdf } from "react-icons/fa";
import { extractTextFromPdf, PdfExtractionError } from "@/lib/kaavya/utils/pdfExtractor";
import { saveKaavya } from "@/lib/kaavya/db/kaavyaStore";

interface KaavyaUploaderProps {
  onSaved: (kaavyaId: number) => void;
  onCancel: () => void;
}

export function KaavyaUploader({ onSaved, onCancel }: KaavyaUploaderProps) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<"pdf" | "pasted">("pdf");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePdfFile(file: File) {
    setError(null);
    setIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setRawText(text);
      setExtractedPreview(text);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      if (err instanceof PdfExtractionError) {
        setError(err.message);
      } else {
        setError('Could not extract text from this PDF. Please try a different file or paste the text directly.');
      }
    } finally {
      setIsExtracting(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      handlePdfFile(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfFile(file);
    }
  }

  async function handleSave() {
    if (!title.trim() || !rawText.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const id = await saveKaavya(title.trim(), rawText, sourceType);
      onSaved(id);
    } catch {
      setError("Could not save to your library. Your browser storage may be full.");
      setIsSaving(false);
    }
  }

  const canSave = title.trim().length > 0 && rawText.trim().length > 0 && !isSaving;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink-800 mb-6">Add Kaavya</h2>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Kaavya title (e.g., Meghadutam)"
        className="w-full rounded-lg border border-parchment-200 bg-parchment-100 px-4 py-3 text-ink-800 placeholder:text-ink-700/50 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
      />

      {/* Tab switcher */}
      <div className="mt-4 flex border-b border-parchment-200">
        <button
          onClick={() => setSourceType("pdf")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            sourceType === "pdf"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-ink-700 hover:text-ink-800"
          }`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => setSourceType("pasted")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            sourceType === "pasted"
              ? "text-accent-500 border-b-2 border-accent-500"
              : "text-ink-700 hover:text-ink-800"
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* PDF Upload tab */}
      {sourceType === "pdf" && (
        <div className="mt-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            aria-label="Upload PDF file"
            className={`cursor-pointer rounded-lg border-2 border-dashed py-12 text-center transition-colors ${
              isDragging
                ? "border-solid border-accent-500 bg-accent-500/10"
                : "border-parchment-200 bg-parchment-100"
            }`}
          >
            {isExtracting ? (
              <div className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                <span className="text-sm text-ink-700">
                  Extracting text from PDF...
                </span>
              </div>
            ) : (
              <>
                <FaFilePdf className="mx-auto text-3xl text-accent-500" />
                <p className="mt-2 text-sm text-ink-700">
                  Drop a PDF here, or click to browse
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          {extractedPreview && !isExtracting && (
            <textarea
              readOnly
              value={extractedPreview}
              className="mt-4 w-full max-h-48 overflow-y-auto rounded-lg border border-parchment-200 bg-parchment-100 p-4 font-sanskrit text-ink-800"
              rows={6}
            />
          )}
        </div>
      )}

      {/* Paste Text tab */}
      {sourceType === "pasted" && (
        <div className="mt-4">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste Sanskrit text here..."
            className="w-full min-h-[200px] rounded-lg border border-parchment-200 bg-parchment-100 p-4 font-sanskrit text-ink-800 placeholder:text-ink-700/50 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-end">
        <button
          onClick={onCancel}
          className="mr-4 text-ink-700 hover:text-ink-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-lg bg-accent-500 px-6 py-3 text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save to Library"}
        </button>
      </div>
    </div>
  );
}
