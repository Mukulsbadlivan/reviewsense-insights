import type { RawReview } from "./types";

export const MAX_FILE_MB = 15;

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`File is larger than ${MAX_FILE_MB} MB.`);
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return value;
  }
  if (name.endsWith(".doc")) throw new Error("Legacy .doc files aren't supported. Please save as .docx or PDF.");
  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 300); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let last: number | null = null;
    let text = "";
    for (const item of content.items as Array<{ str: string; transform: number[]; hasEOL?: boolean }>) {
      const y = item.transform?.[5];
      if (last !== null && y !== undefined && Math.abs(y - last) > 14) text += "\n\n";
      else if (last !== null && y !== undefined && Math.abs(y - last) > 2) text += "\n";
      text += item.str;
      if (item.hasEOL) text += "\n";
      last = y ?? last;
    }
    pages.push(text);
  }
  return pages.join("\n\n");
}

const MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");

export function findDate(s: string): { date?: string; rest: string } {
  const iso = s.match(/\b(20\d{2}|19\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return { date: fmt(+iso[1], +iso[2], +iso[3]), rest: s.replace(iso[0], "") };
  const mdy = s.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (mdy) {
    const m = MONTHS.indexOf(mdy[1].slice(0, 3).toLowerCase());
    if (m >= 0) return { date: fmt(+mdy[3], m + 1, +mdy[2]), rest: s.replace(mdy[0], "") };
  }
  const dmy = s.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/);
  if (dmy) {
    const m = MONTHS.indexOf(dmy[2].slice(0, 3).toLowerCase());
    if (m >= 0) return { date: fmt(+dmy[3], m + 1, +dmy[1]), rest: s.replace(dmy[0], "") };
  }
  const slash = s.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (slash) {
    let [a, b] = [+slash[1], +slash[2]];
    if (a > 12) [a, b] = [b, a]; // assume m/d unless clearly d/m
    return { date: fmt(+slash[3], a, b), rest: s.replace(slash[0], "") };
  }
  return { rest: s };
}

function fmt(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === delim && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function tryCsv(lines: string[]): RawReview[] | null {
  const header = lines[0]?.toLowerCase() ?? "";
  const delim = header.includes("\t") ? "\t" : header.includes(";") && !header.includes(",") ? ";" : ",";
  if (!header.includes(delim)) return null;
  const cols = splitCsvLine(header, delim);
  const textIdx = cols.findIndex((c) => /review|comment|text|feedback|content|body/.test(c));
  if (textIdx < 0) return null;
  const dateIdx = cols.findIndex((c) => /date|time|posted/.test(c));
  const srcIdx = cols.findIndex((c) => /source|platform|channel|site|author|user|name/.test(c));
  return lines.slice(1).map((l) => splitCsvLine(l, delim)).filter((r) => r[textIdx]).map((r) => ({
    text: r[textIdx],
    date: dateIdx >= 0 ? findDate(r[dateIdx] ?? "").date : undefined,
    source: srcIdx >= 0 ? r[srcIdx] || undefined : undefined,
  }));
}

const BULLET = /^\s*(?:\d{1,4}[.)\]:-]|[-•*▪●◦–]|\(\d+\)|#\d+|review\s*\d+\s*[:.-])\s+/i;

export function splitReviews(raw: string): RawReview[] {
  const text = raw.replace(/\r/g, "").replace(/\u00a0/g, " ");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const csv = tryCsv(lines);
  if (csv && csv.length) return clean(csv);

  let chunks: string[];
  const bulletLines = lines.filter((l) => BULLET.test(l)).length;
  if (bulletLines >= 3 && bulletLines >= lines.length * 0.25) {
    chunks = [];
    for (const l of lines) {
      if (BULLET.test(l) || !chunks.length) chunks.push(l.replace(BULLET, ""));
      else chunks[chunks.length - 1] += " " + l;
    }
  } else {
    const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    chunks = paras.length >= 3 && paras.length * 1.5 < lines.length ? paras : lines;
  }
  return clean(chunks.map(parseChunk));
}

function parseChunk(chunk: string): RawReview {
  let s = chunk;
  let source: string | undefined;
  const tag = s.match(/^\[([^\]]{2,40})\]\s*/) ?? s.match(/\b(?:source|platform)\s*[:=]\s*([\w .@-]{2,40}?)(?:[|;,]|$)/i);
  if (tag) { source = tag[1].trim(); s = s.replace(tag[0], " "); }
  const by = s.match(/[—–-]\s*@?([A-Z][\w.]*(?:\s[A-Z][\w.]*)?)\s*$/);
  if (by && !source) { source = by[1]; s = s.slice(0, by.index); }
  const d = findDate(s);
  s = d.rest.replace(/\b(?:date|posted)\s*[:=]\s*/i, "").replace(/^[\s|,;:-]+|[\s|,;-]+$/g, "").replace(/\s{2,}/g, " ");
  return { text: s.replace(/^["“]|["”]$/g, "").trim(), date: d.date, source };
}

function clean(list: RawReview[]): RawReview[] {
  const seen = new Set<string>();
  return list.filter((r) => {
    const t = r.text.trim();
    if (t.length < 8 || t.split(/\s+/).length < 2) return false;
    if (/^(page \d+|customer reviews?|reviews?|comments?)$/i.test(t)) return false;
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 5000);
}
