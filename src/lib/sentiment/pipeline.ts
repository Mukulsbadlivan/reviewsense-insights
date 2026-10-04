import { analyzeReviews } from "../analyze.functions";
import { classify, detectContext } from "./engine";
import { splitReviews } from "./parse";
import { CONTEXT_LABELS, type Analysis, type Classification, type Context } from "./types";

const TITLES: Record<Exclude<Context, "auto">, string> = {
  product: "Product Review Intelligence",
  youtube: "YouTube Comment Intelligence",
  movie: "Movie Review Intelligence",
  company: "Employer Review Intelligence",
  app: "App Review Intelligence",
  other: "Review Sentiment Intelligence",
};

export async function runAnalysis(opts: { text: string; fileName: string; context: Context; subject?: string }): Promise<Analysis> {
  const raw = splitReviews(opts.text);
  if (!raw.length) throw new Error("We couldn't find any reviews in this document. Try one review per line, numbered items, or paragraphs.");
  const ctx = opts.context === "auto" ? detectContext(raw.map((r) => r.text)) : opts.context;
  let engine = "Lexicon engine (local)";
  let results: Classification[];
  try {
    const res = await analyzeReviews({ data: { texts: raw.map((r) => r.text.slice(0, 5000)) } });
    results = res.results;
    engine = res.engine;
  } catch {
    results = raw.map((r) => classify(r.text));
    engine = "Lexicon engine (in-browser fallback)";
  }
  const subject = opts.subject || opts.fileName.replace(/\.(pdf|docx)$/i, "").replace(/[_-]+/g, " ");
  return {
    title: TITLES[ctx],
    subject,
    context: ctx,
    fileName: opts.fileName,
    engine,
    createdAt: new Date().toISOString(),
    reviews: raw.map((r, i) => ({ ...r, ...results[i]!, id: i + 1 })),
  };
}

export const contextLabel = (c: Context) => CONTEXT_LABELS[c];
