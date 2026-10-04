export type Sentiment = "positive" | "negative" | "neutral";
export type Context = "auto" | "product" | "youtube" | "movie" | "company" | "app" | "other";

export const CONTEXT_LABELS: Record<Context, string> = {
  auto: "Auto Detect",
  product: "Product",
  youtube: "YouTube",
  movie: "Movie",
  company: "Company",
  app: "App",
  other: "Other",
};

export interface RawReview {
  text: string;
  date?: string; // ISO yyyy-mm-dd
  source?: string;
}

export interface Classification {
  sentiment: Sentiment;
  confidence: number; // 0..1
  score: number; // -1..1
  keywords: string[];
}

export interface Review extends RawReview, Classification {
  id: number;
}

export interface Analysis {
  title: string;
  subject: string;
  context: Exclude<Context, "auto">;
  fileName: string;
  engine: string;
  reviews: Review[];
  createdAt: string;
}
