import { AnalysisView } from "./components/AnalysisView";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-ink-900">
          Sanskrit Analyzer
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-700">
          Deep grammatical analysis of Sanskrit text &mdash; sandhi splitting,
          samasa decomposition, morphological breakdown, and dictionary-backed
          meanings.
        </p>
      </header>

      <section className="mt-12 w-full max-w-2xl rounded-lg border border-parchment-200 bg-parchment-100 p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent-600">
          Sample Verse
        </h2>
        <blockquote className="font-sanskrit text-2xl leading-[var(--spacing-sanskrit)] text-ink-900">
          धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः।
          <br />
          मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय॥
        </blockquote>
        <p className="mt-4 text-sm italic text-ink-700">
          &mdash; Bhagavad G&#299;t&#257; 1.1
        </p>
      </section>

      <hr className="my-12 w-full max-w-4xl border-t border-parchment-200" />

      <section className="w-full max-w-4xl">
        <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-accent-600">
          Text Analysis
        </h2>
        <p className="mb-6 text-center text-sm text-ink-600">
          Enter Devanagari text below for grammatical analysis
        </p>
        <AnalysisView />
      </section>
    </main>
  );
}
