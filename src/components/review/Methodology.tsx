import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

const ITEMS = [
  { icon: ThumbsUp, cls: "bg-positive-soft text-positive", title: "Positive", body: "Praise, satisfaction or recommendation outweighs criticism (e.g. “battery lasts forever, love it”)." },
  { icon: ThumbsDown, cls: "bg-negative-soft text-negative", title: "Negative", body: "Complaints, frustration or warnings dominate (e.g. “arrived damaged, refund took weeks”)." },
  { icon: Minus, cls: "bg-neutral-soft text-neutral", title: "Neutral", body: "Factual, mixed or question-style text with no clear lean (e.g. “arrived on Tuesday”)." },
];

export function Methodology() {
  return (
    <section className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">Methodology</p>
          <h2 className="mt-2 text-2xl font-semibold">How ReviewSense scores sentiment</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Text is extracted from your PDF or DOCX in the browser, split into individual reviews (lines, numbered or bulleted items, paragraphs, or CSV rows), then scored on the server by a lexicon model that accounts for negation (“not good”), intensifiers (“really bad”), contrast (“…but”), emoji and star ratings. An optional LLM can be plugged in server-side; the local engine always works as a fallback.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {ITEMS.map(({ icon: Icon, cls, title, body }) => (
            <div key={title} className="rounded-2xl border p-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${cls}`}><Icon className="h-4 w-4" /></span>
              <p className="mt-3 font-display font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
          <div className="rounded-2xl border bg-muted p-5 sm:col-span-3">
            <p className="font-display font-semibold">Limitations</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Results are automated estimates, not ground truth. Sarcasm, slang, domain jargon, non-English text and very short comments reduce accuracy. Confidence reflects how strongly the language leans one way. Scanned (image-only) PDFs contain no extractable text.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
