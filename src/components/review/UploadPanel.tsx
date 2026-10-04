import { useRef, useState } from "react";
import { FileText, UploadCloud, Sparkles, Loader2, Youtube, Package, Film, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTEXT_LABELS, type Context } from "@/lib/sentiment/types";
import { MAX_FILE_MB } from "@/lib/sentiment/parse";
import { SAMPLES } from "@/lib/sentiment/samples";
import { cn } from "@/lib/utils";

const SAMPLE_ICONS = { youtube: Youtube, product: Package, movie: Film, company: Building2 } as const;

interface Props {
  busy: string | null;
  error: string | null;
  onFile: (file: File, context: Context, subject: string) => void;
  onSample: (id: string) => void;
}

export function UploadPanel({ busy, error, onFile, onSample }: Props) {
  const [drag, setDrag] = useState(false);
  const [context, setContext] = useState<Context>("auto");
  const [subject, setSubject] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f?: File | null) => {
    if (!f) return;
    setLocalErr(null);
    if (!/\.(pdf|docx)$/i.test(f.name)) return setLocalErr("Unsupported file type. Please upload a PDF or DOCX file.");
    if (f.size > MAX_FILE_MB * 1024 * 1024) return setLocalErr(`File is larger than ${MAX_FILE_MB} MB.`);
    if (f.size === 0) return setLocalErr("This file is empty.");
    onFile(f, context, subject.trim());
  };

  const err = localErr ?? error;

  return (
    <section className="bg-hero relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-hero bg-hero-glass px-3 py-1 text-xs font-medium tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" /> Universal sentiment intelligence
          </p>
          <h1 className="text-4xl leading-[1.05] font-semibold md:text-6xl">
            Turn a pile of reviews into a decision-ready dashboard.
          </h1>
          <p className="text-hero-muted mt-5 max-w-xl text-lg">
            Upload a PDF or Word file of product reviews, YouTube comments, movie critiques, employer or app reviews. ReviewSense extracts each one, scores sentiment and surfaces what matters.
          </p>
          <div className="mt-8">
            <p className="text-hero-muted mb-3 text-xs font-medium tracking-wide uppercase">Or explore a demo dataset</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s) => {
                const Icon = SAMPLE_ICONS[s.id as keyof typeof SAMPLE_ICONS];
                return (
                  <Button key={s.id} variant="heroGhost" size="sm" disabled={!!busy} onClick={() => onSample(s.id)}>
                    <Icon className="h-4 w-4" /> {s.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="animate-rise rounded-2xl bg-card p-5 text-card-foreground shadow-card md:p-6" style={{ animationDelay: "120ms" }}>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a PDF or DOCX file"
            onClick={() => !busy && input.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) pick(e.dataTransfer.files[0]); }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all",
              drag ? "border-primary bg-accent" : "border-input hover:border-primary/60 hover:bg-muted",
              busy && "pointer-events-none opacity-80",
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 font-medium">{busy}</p>
                <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <UploadCloud className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold">Drop your review document here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" /> PDF or DOCX · up to {MAX_FILE_MB} MB
                </div>
              </>
            )}
            <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ctx">Review context</Label>
              <Select value={context} onValueChange={(v) => setContext(v as Context)}>
                <SelectTrigger id="ctx"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTEXT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject name <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="subject" placeholder="e.g. Acme Air Fryer" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={80} />
            </div>
          </div>

          {err && <p role="alert" className="mt-4 rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{err}</p>}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Works best with one review per line, numbered or bulleted lists, paragraphs, or CSV-style text with a “review” column. Dates and sources are detected when present. Files are read in your browser.
          </p>
        </div>
      </div>
    </section>
  );
}
