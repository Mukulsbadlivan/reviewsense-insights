import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { UploadPanel } from "@/components/review/UploadPanel";
import { Dashboard } from "@/components/review/Dashboard";
import { Methodology } from "@/components/review/Methodology";
import { extractText } from "@/lib/sentiment/parse";
import { runAnalysis } from "@/lib/sentiment/pipeline";
import { SAMPLES } from "@/lib/sentiment/samples";
import type { Analysis, Context } from "@/lib/sentiment/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReviewSense — Universal Sentiment Intelligence" },
      { name: "description", content: "Upload a PDF or Word file of reviews and get an instant sentiment dashboard with insights, trends and CSV export." },
      { property: "og:title", content: "ReviewSense — Universal Sentiment Intelligence" },
      { property: "og:description", content: "Turn product, YouTube, movie, company and app reviews into a decision-ready sentiment dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (fn: () => Promise<Analysis>) => {
    setError(null);
    try {
      const a = await fn();
      setAnalysis(a);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while analyzing this file.");
    } finally {
      setBusy(null);
    }
  };

  const onFile = (file: File, context: Context, subject: string) =>
    go(async () => {
      setBusy("Extracting text…");
      let text: string;
      try { text = await extractText(file); } catch (e) {
        throw new Error(e instanceof Error && /Unsupported|larger|Legacy/.test(e.message) ? e.message : "We couldn't read this file. It may be corrupted, password-protected or not a valid PDF/DOCX.");
      }
      if (!text.trim()) throw new Error("No text found. Scanned/image-only PDFs aren't supported — try a text-based PDF or DOCX.");
      setBusy("Classifying sentiment…");
      return runAnalysis({ text, fileName: file.name, context, subject });
    });

  const onSample = (id: string) =>
    go(async () => {
      const s = SAMPLES.find((x) => x.id === id)!;
      setBusy(`Loading ${s.label} demo…`);
      return runAnalysis({ text: s.text, fileName: `Demo · ${s.label}`, context: s.context, subject: s.subject });
    });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-hero bg-hero">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <button onClick={() => setAnalysis(null)} className="flex items-center gap-2 font-display font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary"><Activity className="h-4 w-4 text-primary-foreground" /></span>
            ReviewSense
          </button>
          <span className="text-hero-muted hidden text-xs sm:block">Universal Sentiment Intelligence</span>
        </div>
      </header>
      <main>
        {analysis ? (
          <Dashboard analysis={analysis} onReset={() => setAnalysis(null)} />
        ) : (
          <UploadPanel busy={busy} error={error} onFile={onFile} onSample={onSample} />
        )}
      </main>
      <Methodology />
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">ReviewSense · Sentiment results are automated estimates.</footer>
    </div>
  );
}
