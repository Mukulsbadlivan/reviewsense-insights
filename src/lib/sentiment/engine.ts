import type { Classification, Context } from "./types";

// Lexicon-based scorer with negation, intensifiers, emoji and rating cues.
const POS: Record<string, number> = {
  good: 2, great: 3, excellent: 3, amazing: 3, awesome: 3, love: 3, loved: 3, loves: 3, best: 3,
  fantastic: 3, wonderful: 3, perfect: 3, nice: 2, happy: 2, helpful: 2, recommend: 2, recommended: 2,
  easy: 2, fast: 2, quick: 2, reliable: 2, smooth: 2, beautiful: 3, brilliant: 3, superb: 3,
  impressive: 2, enjoy: 2, enjoyed: 2, fun: 2, solid: 2, worth: 2, satisfied: 2, friendly: 2,
  clean: 1, clear: 1, comfortable: 2, durable: 2, affordable: 2, intuitive: 2, informative: 2,
  inspiring: 3, masterpiece: 3, stunning: 3, gripping: 2, hilarious: 2, supportive: 2, growth: 1,
  flexible: 2, fair: 1, generous: 2, thanks: 2, thank: 2, useful: 2, outstanding: 3, favorite: 2,
  favourite: 2, polished: 2, responsive: 2, efficient: 2, pleased: 2, delighted: 3, value: 1,
  works: 1, worked: 1, fixed: 1, improved: 2, glad: 2, cool: 2, epic: 3, legend: 2, gem: 3,
};
const NEG: Record<string, number> = {
  bad: 2, terrible: 3, awful: 3, horrible: 3, worst: 3, hate: 3, hated: 3, poor: 2, broken: 3,
  broke: 2, useless: 3, waste: 3, disappointing: 3, disappointed: 3, disappointment: 3, slow: 2,
  boring: 2, crash: 3, crashes: 3, crashed: 3, bug: 2, bugs: 2, buggy: 3, laggy: 2, lag: 2,
  expensive: 2, overpriced: 3, rude: 3, cheap: 1, fake: 3, scam: 3, refund: 2, late: 2, delayed: 2,
  damaged: 3, defective: 3, noisy: 2, annoying: 2, confusing: 2, difficult: 2, hard: 1, problem: 2,
  problems: 2, issue: 2, issues: 2, fail: 2, failed: 2, fails: 2, error: 2, errors: 2, missing: 2,
  wrong: 2, unhelpful: 3, toxic: 3, underpaid: 3, burnout: 3, stressful: 2, micromanagement: 3,
  layoffs: 2, clickbait: 3, dislike: 2, unwatchable: 3, predictable: 1, dull: 2, mess: 2, ugly: 2,
  frustrating: 3, frustrated: 3, unreliable: 3, ads: 1, never: 1, worse: 2, meh: 1, mediocre: 2,
  stopped: 1, cancel: 2, cancelled: 2, unfortunately: 1, sadly: 1, ripoff: 3, garbage: 3, trash: 3,
};
const INTENS: Record<string, number> = { very: 1.5, really: 1.4, extremely: 1.8, so: 1.3, super: 1.5, absolutely: 1.7, totally: 1.4, quite: 1.2, highly: 1.5, incredibly: 1.8 };
const NEGATORS = new Set(["not", "no", "never", "dont", "don't", "isnt", "isn't", "wasnt", "wasn't", "cant", "can't", "won't", "wont", "didnt", "didn't", "doesnt", "doesn't", "hardly", "barely", "without"]);
const POS_EMOJI = /[😀😃😄😁😊😍🥰👍❤️💯🔥🙌👏⭐]/gu;
const NEG_EMOJI = /[😡😠😞😢😭👎💔🤮😤]/gu;

export const STOPWORDS = new Set(
  "a an the and or but if of to in on at for with is are was were be been it its this that these those i me my we our you your he she they them their his her as so very really just not no can could would should will do does did have has had from by about than then there here what which who when where how all any some more most much also too only out up down over into get got one even still such own same well like dont don't im i'm it's its thats much many lot lots thing things way make made use used using 1 2 3 4 5 review reviews".split(" "),
);

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[’]/g, "'").match(/[a-z][a-z']+/g) ?? [];
}

export function classify(text: string): Classification {
  const tokens = tokenize(text);
  let pos = 0, neg = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    let w = POS[t] ?? 0;
    let n = NEG[t] ?? 0;
    if (!w && !n) continue;
    const prev = tokens[i - 1], prev2 = tokens[i - 2];
    const mult = (prev && INTENS[prev]) || 1;
    const negated = (prev && NEGATORS.has(prev)) || (prev2 && NEGATORS.has(prev2) && !POS[prev] && !NEG[prev]);
    if (negated) [w, n] = [n * 0.6, w * 0.9];
    pos += w * mult;
    neg += n * mult;
  }
  pos += (text.match(POS_EMOJI)?.length ?? 0) * 1.5;
  neg += (text.match(NEG_EMOJI)?.length ?? 0) * 1.5;
  const rating = text.match(/\b([1-5])(?:\.\d)?\s*(?:\/\s*5|stars?|★)/i);
  if (rating) {
    const r = Number(rating[1]);
    if (r >= 4) pos += 3; else if (r <= 2) neg += 3;
  }
  if (/!{1,}/.test(text)) { pos *= 1.1; neg *= 1.1; }
  // "but" shifts weight to the clause after it
  const butIdx = text.toLowerCase().lastIndexOf(" but ");
  if (butIdx > 0) {
    const tail = classifyRaw(text.slice(butIdx + 5));
    pos += tail.pos * 0.6; neg += tail.neg * 0.6;
  }
  const total = pos + neg;
  const score = total === 0 ? 0 : (pos - neg) / (total + 2);
  let sentiment: Classification["sentiment"] = "neutral";
  if (score > 0.12) sentiment = "positive";
  else if (score < -0.12) sentiment = "negative";
  const strength = Math.min(1, total / 8);
  const confidence = sentiment === "neutral"
    ? 0.55 + 0.35 * (1 - Math.min(1, Math.abs(score) / 0.12)) * (total === 0 ? 1 : 0.7)
    : 0.55 + 0.4 * Math.min(1, Math.abs(score) * 1.4) * (0.5 + 0.5 * strength);
  return {
    sentiment,
    score: Math.max(-1, Math.min(1, score)),
    confidence: Math.round(Math.min(0.97, confidence) * 100) / 100,
    keywords: extractKeywords(tokens),
  };
}

function classifyRaw(text: string) {
  let pos = 0, neg = 0;
  for (const t of tokenize(text)) { pos += POS[t] ?? 0; neg += NEG[t] ?? 0; }
  return { pos, neg };
}

export function extractKeywords(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const t of tokens) if (t.length > 3 && !STOPWORDS.has(t) && !NEGATORS.has(t)) out.add(t);
  return [...out].slice(0, 8);
}

const CONTEXT_CUES: Record<Exclude<Context, "auto" | "other">, string[]> = {
  youtube: ["video", "channel", "subscribe", "subscribed", "upload", "watching", "content", "creator", "editing", "views"],
  movie: ["movie", "film", "acting", "actor", "actress", "plot", "director", "cinema", "scene", "cast", "screenplay", "sequel"],
  company: ["manager", "management", "salary", "culture", "employees", "work-life", "colleagues", "office", "benefits", "interview", "career"],
  app: ["app", "update", "login", "crash", "crashes", "notifications", "android", "ios", "interface", "subscription", "install"],
  product: ["product", "delivery", "quality", "price", "package", "shipping", "battery", "bought", "purchase", "material", "size"],
};

export function detectContext(texts: string[]): Exclude<Context, "auto"> {
  const all = tokenize(texts.join(" ").slice(0, 60000));
  const counts = Object.fromEntries(Object.keys(CONTEXT_CUES).map((k) => [k, 0])) as Record<string, number>;
  for (const t of all) for (const [k, cues] of Object.entries(CONTEXT_CUES)) if (cues.includes(t)) counts[k]++;
  const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return n >= 2 ? (best as Exclude<Context, "auto">) : "other";
}
