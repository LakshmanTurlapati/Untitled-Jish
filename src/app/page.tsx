"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnalysisView } from "./components/AnalysisView";
import { FaSearch, FaBook, FaBrain } from "react-icons/fa";

// Dynamic imports to avoid SSR/prerender issues with IndexedDB and pdfjs-dist
const KaavyaLibrary = dynamic(() => import("./components/KaavyaLibrary").then(m => ({ default: m.KaavyaLibrary })), { ssr: false });
const KaavyaUploader = dynamic(() => import("./components/KaavyaUploader").then(m => ({ default: m.KaavyaUploader })), { ssr: false });
const KaavyaReader = dynamic(() => import("./components/KaavyaReader").then(m => ({ default: m.KaavyaReader })), { ssr: false });
const QuizModeSelector = dynamic(() => import("./components/QuizModeSelector").then(m => ({ default: m.QuizModeSelector })), { ssr: false });
const VocabularyDashboard = dynamic(() => import("./components/VocabularyDashboard").then(m => ({ default: m.VocabularyDashboard })), { ssr: false });
const QuizView = dynamic(() => import("./components/QuizView").then(m => ({ default: m.QuizView })), { ssr: false });
const MetricsDashboard = dynamic(() => import("./components/MetricsDashboard").then(m => ({ default: m.MetricsDashboard })), { ssr: false });
const SmartQuizPrompt = dynamic(() => import("./components/SmartQuizPrompt").then(m => ({ default: m.SmartQuizPrompt })), { ssr: false });
const CompactRankBadge = dynamic(() => import("./components/CompactRankBadge").then(m => ({ default: m.CompactRankBadge })), { ssr: false });

type AppView = "analyze" | "library" | "uploader" | "reader" | "quiz" | "quiz-session";

export default function Home() {
  const [view, setView] = useState<AppView>("analyze");
  const [selectedKaavyaId, setSelectedKaavyaId] = useState<number | null>(null);
  const [quizMode, setQuizMode] = useState<"daily" | "kaavya" | null>(null);
  const [quizKaavyaId, setQuizKaavyaId] = useState<number | undefined>(undefined);

  return (
    <main className="mx-auto max-w-[640px] px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-ink-900 text-center mb-6">
        Sanskrit Learning Platform
      </h1>

      {/* Top-level tab navigation */}
      {(view === "analyze" || view === "library" || view === "quiz") && (
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
          <button
            onClick={() => setView("quiz")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "quiz"
                ? "bg-white shadow-sm text-accent-500"
                : "text-ink-700 hover:text-ink-800"
            }`}
          >
            <FaBrain className="text-sm" />
            Quiz
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
          onQuizKaavya={(kaavyaId) => {
            setQuizMode("kaavya");
            setQuizKaavyaId(kaavyaId);
            setView("quiz-session");
          }}
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

      {view === "reader" && selectedKaavyaId && (
        <KaavyaReader
          kaavyaId={selectedKaavyaId}
          onBack={() => setView("library")}
        />
      )}

      {view === "quiz" && (
        <>
          <div className="flex justify-end mb-3">
            <CompactRankBadge />
          </div>
          <SmartQuizPrompt
            onReviewNow={() => {
              setQuizMode("daily");
              setQuizKaavyaId(undefined);
              setView("quiz-session");
            }}
          />
          <VocabularyDashboard />
          <div className="mt-6">
            <QuizModeSelector
              onSelectMode={(selectedMode, selectedKaavya) => {
                setQuizMode(selectedMode);
                setQuizKaavyaId(selectedKaavya);
                setView("quiz-session");
              }}
            />
          </div>
          <div className="mt-6">
            <MetricsDashboard />
          </div>
        </>
      )}

      {view === "quiz-session" && quizMode && (
        <QuizView
          mode={quizMode}
          kaavyaId={quizKaavyaId}
          onBackToModes={() => {
            setQuizMode(null);
            setQuizKaavyaId(undefined);
            setView("quiz");
          }}
        />
      )}
    </main>
  );
}
