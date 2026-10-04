import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classify } from "./sentiment/engine";
import type { Classification } from "./sentiment/types";

// Server-side integration boundary. If SENTIMENT_LLM_API_KEY (and optionally
// SENTIMENT_LLM_URL / SENTIMENT_LLM_MODEL, OpenAI-compatible) are configured,
// reviews are classified by the LLM; otherwise the local lexicon engine runs.
export const analyzeReviews = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ texts: z.array(z.string().max(5000)).max(5000) }).parse(d))
  .handler(async ({ data }): Promise<{ engine: string; results: Classification[] }> => {
    const local = data.texts.map(classify);
    const key = process.env["SENTIMENT_LLM_API_KEY"];
    if (!key || data.texts.length > 300) return { engine: "Lexicon engine (local)", results: local };
    try {
      const url = process.env["SENTIMENT_LLM_URL"] ?? "https://api.openai.com/v1/chat/completions";
      const model = process.env["SENTIMENT_LLM_MODEL"] ?? "gpt-4o-mini";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: 'Classify each review. Reply JSON {"r":[{"s":"positive|negative|neutral","c":0-1}]} in input order.' },
            { role: "user", content: JSON.stringify(data.texts) },
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const r = JSON.parse(json.choices[0].message.content).r as { s: string; c: number }[];
      if (r.length !== local.length) throw new Error("length mismatch");
      return {
        engine: `LLM (${model})`,
        results: local.map((l, i) => ({ ...l, sentiment: (["positive", "negative", "neutral"].includes(r[i].s) ? r[i].s : l.sentiment) as Classification["sentiment"], confidence: Math.max(0, Math.min(1, Number(r[i].c) || l.confidence)) })),
      };
    } catch (e) {
      console.error("LLM classification failed, using local engine", e);
      return { engine: "Lexicon engine (local fallback)", results: local };
    }
  });
