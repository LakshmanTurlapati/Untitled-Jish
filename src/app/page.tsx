"use client";

import { useState } from "react";
import { AnalysisView } from "./components/AnalysisView";
import { KaavyaLibrary } from "./components/KaavyaLibrary";
import { KaavyaUploader } from "./components/KaavyaUploader";
import { FaSearch, FaBook, FaArrowLeft } from "react-icons/fa";

type AppView = "analyze" | "library" | "uploader" | "reader";

export default function Home() {
  const [view, setView] = useState<AppView>("analyze");
  const [selectedKaavyaId, setSelectedKaavyaId] = useState<number | null>(null);

  return (
    <main className="mx-auto max-w-[640px] px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-ink-900 text-center mb-6">
        Sanskrit Learning Platform
      </h1>

      {/* Top-level tab navigation */}
      {(view === "analyze" || view === "library") && (
        <div className="flex bg-parchment-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setView("analyze")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "analyze"
                ? "bg-white shadow-sm text-accent-500"
                : "text-ink-700 hover:text-ink-800"
            }`}
          >
            <FaSearch className="text-sm" />
            Analyze
          </button>
          <button
            onClick={() => setView("library")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "library"
                ? "bg-white shadow-sm text-accent-500"
                : "text-ink-700 hover:text-ink-800"
            }`}
          >
            <FaBook className="text-sm" />
            Library
          </button>
        </div>
      )}

      {/* View content */}
      {view === "analyze" && <AnalysisView />}

      {view === "library" && (
        <KaavyaLibrary
          onOpenKaavya={(id) => {
            setSelectedKaavyaId(id);
            setView("reader");
          }}
          onAddKaavya={() => setView("uploader")}
        />
      )}

      {view === "uploader" && (
        <KaavyaUploader
          onSaved={(id) => {
            setSelectedKaavyaId(id);
            setView("reader");
          }}
          onCancel={() => setView("library")}
        />
      )}

      {view === "reader" && (
        <div className="text-center py-16">
          <p className="text-ink-700 mb-4">Reader coming in Plan 03</p>
          <button
            onClick={() => setView("library")}
            className="inline-flex items-center gap-2 text-accent-500 hover:text-accent-600 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Library
          </button>
        </div>
      )}
    </main>
  );
}
