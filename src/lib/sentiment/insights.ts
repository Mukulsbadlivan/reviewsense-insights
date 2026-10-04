import type { Review, Sentiment } from "./types";

export function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}

export function counts(reviews: Review[]) {
  const c = { positive: 0, negative: 0, neutral: 0 };
  for (const r of reviews) c[r.sentiment]++;
  return c;
}

export function topKeywords(reviews: Review[], sentiment: Sentiment, n = 8) {
  const m = new Map<string, number>();
  for (const r of reviews) if (r.sentiment === sentiment) for (const k of r.keywords) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].filter(([, v]) => v > 1 || m.size < 15).sort((a, b) => b[1] - a[1]).slice(0, n).map(([word, count]) => ({ word, count }));
}

export function trend(reviews: Review[]) {
  const dated = reviews.filter((r) => r.date);
  if (dated.length < 3) return [];
  const dates = dated.map((r) => r.date!).sort();
  const spanDays = (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / 864e5;
  const key = (d: string) => (spanDays > 120 ? d.slice(0, 7) : spanDays > 21 ? weekKey(d) : d);
  const m = new Map<string, { period: string; positive: number; negative: number; neutral: number }>();
  for (const r of dated) {
    const k = key(r.date!);
    if (!m.has(k)) m.set(k, { period: k, positive: 0, negative: 0, neutral: 0 });
    m.get(k)![r.sentiment]++;
  }
  return [...m.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function weekKey(d: string) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
}

export function representative(reviews: Review[], s: Sentiment, n = 2) {
  return reviews
    .filter((r) => r.sentiment === s && r.text.length > 30 && r.text.length < 400)
    .sort((a, b) => b.confidence * Math.abs(b.score) - a.confidence * Math.abs(a.score))
    .slice(0, n);
}

export interface Insight { tone: Sentiment | "info"; title: string; body: string }

export function buildInsights(reviews: Review[], subject: string): Insight[] {
  const total = reviews.length;
  if (!total) return [];
  const c = counts(reviews);
  const out: Insight[] = [];
  const dom = (Object.entries(c) as [Sentiment, number][]).sort((a, b) => b[1] - a[1])[0];
  out.push({
    tone: dom[0],
    title: `${cap(dom[0])} sentiment dominates`,
    body: `${pct(dom[1], total)}% of ${total} reviews about ${subject} read as ${dom[0]}. Net sentiment score: ${pct(c.positive - c.negative, total) > 0 ? "+" : ""}${pct(c.positive - c.negative, total)} pts.`,
  });
  const negK = topKeywords(reviews, "negative", 4).map((k) => k.word);
  const posK = topKeywords(reviews, "positive", 4).map((k) => k.word);
  if (negK.length && c.negative) out.push({ tone: "negative", title: "Major complaints", body: `Negative reviews most often mention ${list(negK)}.` });
  if (posK.length && c.positive) out.push({ tone: "positive", title: "Key strengths", body: `Positive reviews repeatedly highlight ${list(posK)}.` });
  const t = trend(reviews);
  if (t.length >= 3) {
    const half = Math.floor(t.length / 2);
    const share = (rows: typeof t) => {
      const s = rows.reduce((a, r) => ({ p: a.p + r.positive, n: a.n + r.positive + r.negative + r.neutral }), { p: 0, n: 0 });
      return s.n ? s.p / s.n : 0;
    };
    const delta = Math.round((share(t.slice(half)) - share(t.slice(0, half))) * 100);
    if (Math.abs(delta) >= 5) out.push({ tone: delta > 0 ? "positive" : "negative", title: delta > 0 ? "Sentiment is improving" : "Sentiment is declining", body: `Positive share moved ${delta > 0 ? "up" : "down"} about ${Math.abs(delta)} pts between the earlier and later half of the period.` });
    else out.push({ tone: "info", title: "Sentiment is stable", body: "Positive share stayed roughly flat across the observed period." });
  }
  const lowConf = reviews.filter((r) => r.confidence < 0.65).length;
  if (pct(lowConf, total) > 20) out.push({ tone: "info", title: "Mixed or ambiguous language", body: `${pct(lowConf, total)}% of reviews were classified with low confidence; consider manual review of those items.` });
  const rec = c.negative / total > 0.3 && negK.length
    ? `Prioritise fixing issues around ${list(negK.slice(0, 2))}, then re-measure sentiment after changes.`
    : posK.length
      ? `Lean into what customers value (${list(posK.slice(0, 2))}) in messaging, and monitor the ${pct(c.negative, total)}% negative feedback for emerging issues.`
      : "Collect more detailed feedback to surface clearer strengths and pain points.";
  out.push({ tone: "info", title: "Recommendation", body: rec });
  return out;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const list = (a: string[]) => a.length <= 1 ? `“${a[0]}”` : a.slice(0, -1).map((w) => `“${w}”`).join(", ") + ` and “${a[a.length - 1]}”`;

export function toCsv(reviews: Review[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["id", "review", "sentiment", "confidence", "score", "date", "source", "keywords"]];
  for (const r of reviews) rows.push([String(r.id), r.text, r.sentiment, r.confidence.toFixed(2), r.score.toFixed(3), r.date ?? "", r.source ?? "", r.keywords.join("; ")]);
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
