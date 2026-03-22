"use client";

import { useState, useRef, useEffect } from "react";

interface ImageUploadProps {
  onTextExtracted: (text: string) => void;
}

export function ImageUpload({ onTextExtracted }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  // Revoke Object URL on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  // Elapsed time counter during OCR extraction
  useEffect(() => {
    if (!isUploading) {
      setElapsedSeconds(0);
      return;
    }
    const intervalId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isUploading]);

  async function handleFile(file: File) {
    // Validate file type
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Unsupported file type. Only JPEG and PNG images are accepted.");
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum size is 20MB.");
      return;
    }

    // Revoke previous Object URL to prevent memory leaks
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    const newUrl = URL.createObjectURL(file);
    previewRef.current = newUrl;
    setPreview(newUrl);

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "OCR processing failed");
      }

      const data = await response.json();
      onTextExtracted(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div className="flex gap-2">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex-1 cursor-pointer rounded-lg border-2 border-dashed border-parchment-200 p-4 text-center transition-colors hover:border-accent-500"
        >
          <p className="text-sm text-ink-600">Upload Image</p>
          <p className="mt-1 text-xs text-ink-600/50">Click or drag</p>
        </div>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-parchment-200 px-4 py-4 text-center transition-colors hover:border-accent-500"
          aria-label="Take Photo"
        >
          <p className="text-sm text-ink-600">Take Photo</p>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleInputChange}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Upload preview"
            className="max-h-48 rounded"
          />
        </div>
      )}

      {isUploading && (
        <p className="mt-2 text-sm text-ink-600 animate-pulse">
          Extracting text... ({elapsedSeconds}s)
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
