import { useMemo, useState } from "react";
import type { Book, DayTotal } from "../lib/data";
import { activitySeries, avgWindow, fmtDate, fmtNum, rollingAverage, streakInfo } from "../lib/data";
import { useCountUp, useReveal } from "../lib/hooks";
import { IconFlame, IconSparkle, IconTrendDown, IconTrendUp } from "./icons";
import { Reveal } from "./ui";

/* ---------------------------- stat tile ---------------------------- */

function StatTile({
  kicker,
  value,
  unit,
  foot,
  footTone = "dim",
  icon,
  delay = 0,
}: {
  kicker: string;
  value: number;
  decimals?: number;
  unit?: string;
  foot: React.ReactNode;
  footTone?: "dim" | "sage" | "ember";
  icon?: React.ReactNode;
  delay?: number;
}) {
  const display = useCountUp(value);
  const tone = footTone === "sage" ? "text-sage" : footTone === "ember" ? "text-ember" : "text-dim";
  return (
    <Reveal delay={delay} className="h-full">
      <div className="flex h-full flex-col rounded-lg border border-linesoft bg-pine/80 p-4.5 transition-colors duration-300 hover:border-line">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-dim">{kicker}</p>
          {icon}
        </div>
        <p className="mt-3 font-mono text-[32px] font-medium leading-none tracking-tight text-paper tabnum">
          {fmtNum(display)}
          {unit && <span className="ml-1 text-[14px] text-dim">{unit}</span>}
        </p>
        <p className={`mt-auto pt-3 text-[12px] leading-snug ${tone}`}>{foot}</p>
      </div>
    </Reveal>
  );
}

/* -------------------------- activity chart ------------------------- */

function ActivityChart({ series }: { series: DayTotal[] }) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const W = 660;
  const H = 216;
  const ML = 36;
  const MR = 6;
  const MT = 12;
  const MB = 24;
  const innerW = W - ML - MR;
  const innerH = H - MT - MB;
  const max = Math.max(12, ...series.map((s) => s.pages));
  const yMax = Math.ceil(max / 10) * 10;
  const bw = innerW / series.length;
  const rolling = useMemo(() => rollingAverage(series, 7), [series]);

  const y = (v: number) => MT + innerH - (v / yMax) * innerH;
  const linePts = rolling
    .map((v, i) => (v === null ? null : `${ML + i * bw + bw / 2},${y(v)}`))
    .filter(Boolean)
    .join(" ");

  const todayIdx = series.length - 1;
  const hoverDay = hover !== null ? series[hover] : null;

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Pages read per day, last 30 days">
        {/* gridlines */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={ML} x2={W - MR} y1={y(yMax * t)} y2={y(yMax * t)} stroke="#26402f" strokeWidth="1" strokeDasharray={t === 0 ? "" : "3 5"} />
            <text x={ML - 8} y={y(yMax * t) + 3.5} textAnchor="end" fontSize="9.5" fill="#6f8773" fontFamily="Spline Sans Mono, monospace">
              {Math.round(yMax * t)}
            </text>
          </g>
        ))}

        {/* bars */}
        {series.map((s, i) => {
          const h = Math.max(s.pages > 0 ? 3 : 0, (s.pages / yMax) * innerH);
          const isHover = hover === i;
          const isToday = i === todayIdx;
          return (
            <rect
              key={s.date}
              x={ML + i * bw + bw * 0.18}
              y={MT + innerH - h}
              width={bw * 0.64}
              height={h}
              rx={2}
              className={inView ? "bar-rise" : ""}
              style={{
                animationDelay: `${i * 16}ms`,
                fill: s.pages === 0 ? "#1d3226" : isToday ? "#e2a94e" : isHover ? "#e2a94e" : "#48684f",
                opacity: s.pages === 0 ? 0.55 : isHover || isToday ? 1 : 0.9,
                transition: "fill .18s ease, opacity .18s ease",
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {/* rolling average */}
        {linePts && (
          <polyline
            points={linePts}
            fill="none"
            stroke="#8fc7a0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: inView ? 0 : 1200,
              transition: "stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1) .3s",
            }}
          />
        )}

        {/* x labels */}
        {[0, 9, 19, 29].map((i) =>
          series[i] ? (
            <text key={i} x={ML + i * bw + bw / 2} y={H - 7} textAnchor="middle" fontSize="9.5" fill="#6f8773" fontFamily="Spline Sans Mono, monospace">
              {fmtDate(series[i].date)}
            </text>
          ) : null
        )}
      </svg>

      {hoverDay && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-raise px-2.5 py-1.5 text-center shadow-card"
          style={{ left: `${((ML + hover * bw + bw / 2) / W) * 100}%`, top: 0 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{fmtDate(hoverDay.date)}</p>
          <p className="font-mono text-[13px] font-semibold text-paper tabnum">
            {hoverDay.pages} <span className="text-[10px] font-normal text-fog">pg</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ panel ------------------------------ */

export default function PacePanel({ books }: { books: Book[] }) {
  const series = useMemo(() => activitySeries(books, 30), [books]);
  const avg7 = avgWindow(series, 7);
  const prev7 = avgWindow(series, 7, 7);
  const delta = prev7 > 0 ? ((avg7 - prev7) / prev7) * 100 : avg7 > 0 ? 100 : 0;
  const best = series.reduce((a, s) => (s.pages > a.pages ? s : a), series[0]);
  const streak = streakInfo(books);
  const pages30 = series.reduce((a, s) => a + s.pages, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <StatTile
          kicker="Avg pace · 7 days"
          value={avg7}
          unit="pg/day"
          delay={0}
          foot={
            delta >= 0 ? (
              <span className="flex items-center gap-1.5 text-sage">
                <IconTrendUp className="h-3.5 w-3.5" /> up {Math.abs(delta).toFixed(0)}% vs prior week
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-ember">
                <IconTrendDown className="h-3.5 w-3.5" /> down {Math.abs(delta).toFixed(0)}% vs prior week
              </span>
            )
          }
        />
        <StatTile
          kicker="Pages · 30 days"
          value={pages30}
          delay={60}
          foot={<span>across {new Set(series.filter((s) => s.pages > 0).map((s) => s.date)).size} reading days</span>}
        />
        <StatTile
          kicker="Best day"
          value={best?.pages ?? 0}
          unit="pg"
          delay={120}
          foot={<span className="flex items-center gap-1.5"><IconSparkle className="h-3.5 w-3.5 text-brass" /> {best ? fmtDate(best.date) : "—"}</span>}
        />
        <StatTile
          kicker="Current streak"
          value={streak.current}
          unit={streak.current === 1 ? "day" : "days"}
          delay={180}
          icon={<IconFlame className="flame-live h-4.5 w-4.5 text-ember" />}
          footTone={streak.current >= 3 ? "sage" : "dim"}
          foot={<span>longest run · {streak.longest} days</span>}
        />
      </div>

      <Reveal delay={100} className="h-full">
        <div className="flex h-full flex-col rounded-lg border border-linesoft bg-pine/80 p-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-paper">Pages per day</h3>
            <div className="flex items-center gap-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[9px] w-[9px] rounded-[2px] bg-[#48684f]" /> pages
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[2px] w-4 rounded bg-sage" /> 7-day avg
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ActivityChart series={series} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
