import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Download, RotateCcw, Search, ThumbsUp, ThumbsDown, Minus, MessageSquareText, Gauge, Lightbulb, CalendarOff, Quote, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Analysis, Review, Sentiment } from "@/lib/sentiment/types";
import { CONTEXT_LABELS } from "@/lib/sentiment/types";
import { buildInsights, counts, pct, representative, toCsv, topKeywords, trend } from "@/lib/sentiment/insights";
import { cn } from "@/lib/utils";

const COLORS: Record<Sentiment, string> = { positive: "var(--positive)", negative: "var(--negative)", neutral: "var(--neutral)" };
const SENTS: Sentiment[] = ["positive", "negative", "neutral"];
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 };

function Card({ title, icon, children, className, action }: { title?: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("animate-rise rounded-2xl border bg-card p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Dashboard({ analysis, onReset }: { analysis: Analysis; onReset: () => void }) {
  const all = analysis.reviews;
  const sources = useMemo(() => [...new Set(all.map((r) => r.source).filter(Boolean))] as string[], [all]);
  const dates = useMemo(() => all.map((r) => r.date).filter(Boolean).sort() as string[], [all]);
  const hasDates = dates.length >= 3;

  const [sent, setSent] = useState<Sentiment | "all">("all");
  const [conf, setConf] = useState<[number, number]>([0, 100]);
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(25);

  const filtered = useMemo(() => all.filter((r) =>
    (sent === "all" || r.sentiment === sent) &&
    r.confidence * 100 >= conf[0] && r.confidence * 100 <= conf[1] &&
    (source === "all" || r.source === source) &&
    (!from || (r.date && r.date >= from)) && (!to || (r.date && r.date <= to))
  ), [all, sent, conf, source, from, to]);

  const tableRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? filtered.filter((r) => r.text.toLowerCase().includes(s) || r.source?.toLowerCase().includes(s)) : filtered;
  }, [filtered, q]);

  const c = counts(filtered);
  const total = filtered.length;
  const avgConf = total ? filtered.reduce((a, r) => a + r.confidence, 0) / total : 0;
  const pie = SENTS.map((s) => ({ name: s, value: c[s] })).filter((d) => d.value);
  const trendData = trend(filtered);
  const kwData = useMemo(() => {
    const p = topKeywords(filtered, "positive", 7).map((k) => ({ word: k.word, positive: k.count, negative: 0 }));
    const n = topKeywords(filtered, "negative", 7).map((k) => ({ word: k.word, positive: 0, negative: -k.count }));
    return [...p, ...n.reverse()];
  }, [filtered]);
  const volumeBySource = useMemo(() => {
    const groups = sources.length > 1 ? sources : ["All reviews"];
    return groups.map((g) => {
      const rs = sources.length > 1 ? filtered.filter((r) => r.source === g) : filtered;
      const cc = counts(rs);
      return { group: g, ...cc };
    });
  }, [filtered, sources]);
  const insights = useMemo(() => buildInsights(filtered, analysis.subject), [filtered, analysis.subject]);
  const bestPos = representative(filtered, "positive");
  const bestNeg = representative(filtered, "negative");
  const filtersActive = sent !== "all" || conf[0] > 0 || conf[1] < 100 || source !== "all" || from || to;

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reviewsense-${analysis.subject.replace(/[^\w]+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">{analysis.title}</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{analysis.subject}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{all.length} reviews extracted</span>·<span>{CONTEXT_LABELS[analysis.context]}</span>·<span>{analysis.fileName}</span>·<span>{analysis.engine}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
          <Button onClick={onReset}><RotateCcw /> New analysis</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.3fr_1fr_1.4fr_auto] lg:items-end">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Sentiment</p>
            <Select value={sent} onValueChange={(v) => setSent(v as Sentiment | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sentiments</SelectItem>
                {SENTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Confidence {conf[0]}% – {conf[1]}%</p>
            <Slider min={0} max={100} step={5} value={conf} onValueChange={(v) => setConf([v[0], v[1]])} aria-label="Confidence range" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Source</p>
            <Select value={source} onValueChange={setSource} disabled={!sources.length}>
              <SelectTrigger><SelectValue placeholder="No sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{sources.length ? "All sources" : "No sources detected"}</SelectItem>
                {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Date range {!hasDates && "(not available)"}</p>
            <div className="flex gap-2">
              <Input type="date" value={from} min={dates[0]} max={dates[dates.length - 1]} onChange={(e) => setFrom(e.target.value)} disabled={!hasDates} aria-label="From date" />
              <Input type="date" value={to} min={dates[0]} max={dates[dates.length - 1]} onChange={(e) => setTo(e.target.value)} disabled={!hasDates} aria-label="To date" />
            </div>
          </div>
          <Button variant="ghost" disabled={!filtersActive} onClick={() => { setSent("all"); setConf([0, 100]); setSource("all"); setFrom(""); setTo(""); }}>Clear</Button>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Total reviews" value={String(total)} sub={filtersActive ? `of ${all.length}` : "analyzed"} icon={<MessageSquareText />} />
        <Kpi label="Positive" value={`${pct(c.positive, total)}%`} sub={`${c.positive} reviews`} tone="positive" icon={<ThumbsUp />} />
        <Kpi label="Negative" value={`${pct(c.negative, total)}%`} sub={`${c.negative} reviews`} tone="negative" icon={<ThumbsDown />} />
        <Kpi label="Neutral" value={`${pct(c.neutral, total)}%`} sub={`${c.neutral} reviews`} tone="neutral" icon={<Minus />} />
        <Kpi label="Avg. confidence" value={`${Math.round(avgConf * 100)}%`} sub="model estimate" icon={<Gauge />} className="col-span-2 lg:col-span-1" />
      </div>

      {total === 0 ? (
        <Card><p className="py-10 text-center text-muted-foreground">No reviews match the current filters.</p></Card>
      ) : (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card title="Sentiment distribution">
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
                      {pie.map((d) => <Cell key={d.name} fill={COLORS[d.name as Sentiment]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend formatter={(v) => <span className="text-xs capitalize text-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Sentiment trend over time" className="lg:col-span-2">
              {trendData.length >= 2 ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={trendData} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {SENTS.map((s) => <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={COLORS[s]} fill={COLORS[s]} fillOpacity={0.35} />)}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                  <CalendarOff className="h-8 w-8 text-muted-foreground" />
                  <p className="max-w-sm text-sm text-muted-foreground">Dates weren't available in this document, so a time trend can't be drawn. See the distribution and volume charts instead.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card title="Top keywords by sentiment">
              {kwData.length ? (
                <div className="h-80">
                  <ResponsiveContainer>
                    <BarChart data={kwData} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => String(Math.abs(v))} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <YAxis type="category" dataKey="word" width={90} tick={{ fontSize: 12, fill: "var(--foreground)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [Math.abs(v), n]} />
                      <Bar dataKey="positive" stackId="k" fill={COLORS.positive} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="negative" stackId="k" fill={COLORS.negative} radius={[4, 0, 0, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground">Not enough repeated keywords to chart.</p>}
            </Card>
            <Card title={sources.length > 1 ? "Review volume by source & sentiment" : "Review volume by sentiment"}>
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart data={volumeBySource} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="group" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Legend formatter={(v) => <span className="text-xs capitalize text-foreground">{v}</span>} />
                    {SENTS.map((s) => <Bar key={s} dataKey={s} fill={COLORS[s]} radius={[4, 4, 0, 0]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card title="Key insights" icon={<Lightbulb className="h-4 w-4 text-primary" />} className="lg:col-span-1">
              <ul className="space-y-4">
                {insights.map((i, k) => (
                  <li key={k} className="flex gap-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", i.tone === "positive" ? "bg-positive" : i.tone === "negative" ? "bg-negative" : i.tone === "neutral" ? "bg-neutral" : "bg-primary")} />
                    <div>
                      <p className="text-sm font-semibold">{i.title}</p>
                      <p className="text-sm text-muted-foreground">{i.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Representative reviews" icon={<Quote className="h-4 w-4 text-primary" />} className="lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <QuoteList title="What people love" items={bestPos} tone="positive" />
                <QuoteList title="What people dislike" items={bestNeg} tone="negative" />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Table */}
      <Card title={`Reviews (${tableRows.length})`} action={
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reviews…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      }>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[320px]">Review</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.slice(0, limit).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="text-sm">{r.text}</TableCell>
                  <TableCell><Badge variant={r.sentiment}>{r.sentiment}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.confidence * 100}%` }} />
                      </div>
                      <span className="font-mono text-xs">{Math.round(r.confidence * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{r.date ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.source ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {tableRows.length > limit && (
          <div className="mt-4 text-center"><Button variant="outline" onClick={() => setLimit((l) => l + 50)}>Show more</Button></div>
        )}
        {!tableRows.length && <p className="py-8 text-center text-sm text-muted-foreground">No reviews match.</p>}
      </Card>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Sentiment labels and confidence are automated estimates and can misread sarcasm, slang or mixed opinions. Validate important decisions with a manual sample.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, icon, tone, className }: { label: string; value: string; sub: string; icon: React.ReactNode; tone?: Sentiment; className?: string }) {
  return (
    <div className={cn("animate-rise rounded-2xl border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4",
          tone === "positive" ? "bg-positive-soft text-positive" : tone === "negative" ? "bg-negative-soft text-negative" : tone === "neutral" ? "bg-neutral-soft text-neutral" : "bg-accent text-primary")}>{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function QuoteList({ title, items, tone }: { title: string; items: Review[]; tone: Sentiment }) {
  return (
    <div>
      <p className={cn("mb-2 text-xs font-semibold tracking-wide uppercase", tone === "positive" ? "text-positive" : "text-negative")}>{title}</p>
      {items.length ? items.map((r) => (
        <blockquote key={r.id} className={cn("mb-3 rounded-xl border-l-4 p-3 text-sm", tone === "positive" ? "border-positive bg-positive-soft" : "border-negative bg-negative-soft")}>
          “{r.text}”
          <footer className="mt-1 text-xs text-muted-foreground">{[r.source, r.date, `${Math.round(r.confidence * 100)}% confidence`].filter(Boolean).join(" · ")}</footer>
        </blockquote>
      )) : <p className="text-sm text-muted-foreground">None in the current selection.</p>}
    </div>
  );
}
