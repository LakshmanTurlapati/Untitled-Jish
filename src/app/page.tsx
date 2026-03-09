import { AnalysisView } from "./components/AnalysisView";

export default function Home() {
  return (
    <main className="mx-auto max-w-[640px] px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-ink-900 text-center mb-6">
        Sanskrit Analyzer
      </h1>
      <AnalysisView />
    </main>
  );
}
