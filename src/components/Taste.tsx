import { useMemo, useState } from "react";
import type { Book } from "../lib/data";
import { fmtNum, genreStats } from "../lib/data";
import { useCountUp, useReveal } from "../lib/hooks";
import { Reveal } from "./ui";

type Mode = "pages" | "books";

export default function Taste({ books }: { books: Book[] }) {
  const [mode, setMode] = useState<Mode>("pages");
  const [hovered, setHovered] = useState<string | null>(null);
  const stats = useMemo(() => genreStats(books), [books]);

  const total = stats.reduce((a, s) => a + (mode === "pages" ? s.pages : s.books), 0);
  const displayTotal = useCountUp(total);
  const { ref, inView } = useReveal<HTMLDivElement>();

  if (stats.length === 0) {
    return (
      <Reveal>
        <div className="rounded-lg border border-dashed border-line bg-pine/60 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <svg viewBox="0 0 200 200" className="h-32 w-32 opacity-30">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#26402f" strokeWidth="26" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#48684f" strokeWidth="26" strokeDasharray="44 396" strokeDashoffset="0" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="#3d5a42" strokeWidth="26" strokeDasharray="28 412" strokeDashoffset="-50" transform="rotate(-90 100 100)" />
            </svg>
          </div>
          <p className="font-display text-xl italic text-fog">No genre data yet.</p>
          <p className="mt-1.5 text-[13px] text-dim">
            Start reading or log pages to see the shape of your taste emerge.
          </p>
        </div>
      </Reveal>
    );
  }

  const R = 70;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = stats.map((s) => {
    const value = mode === "pages" ? s.pages : s.books;
    const frac = total > 0 ? value / total : 0;
    const seg = { ...s, value, frac, start: acc };
    acc += frac;
    return seg;
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Reveal className="h-full">
        <div ref={ref} className="flex h-full flex-col items-center justify-center rounded-lg border border-linesoft bg-pine/80 p-6">
          <div className="relative">
            <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64" role="img" aria-label="Genre distribution">
              <circle cx="100" cy="100" r={R} fill="none" stroke="#1d3226" strokeWidth="26" />
              <g transform="rotate(-90 100 100)">
                {segments.map((s) => {
                  const len = s.frac * C;
                  const shown = inView ? len : 0;
                  const isHover = hovered === s.genre;
                  const dimmed = hovered !== null && !isHover;
                  return (
                    <circle
                      key={s.genre}
                      cx="100"
                      cy="100"
                      r={R}
                      fill="none"
                      stroke={s.color}
                      strokeLinecap="butt"
                      strokeDasharray={`${Math.max(0, shown - 1.5)} ${C - Math.max(0, shown - 1.5)}`}
                      strokeDashoffset={-s.start * C}
                      strokeWidth={isHover ? 33 : 26}
                      opacity={dimmed ? 0.28 : 1}
                      style={{
                        transition: "stroke-dasharray .9s cubic-bezier(.22,1,.36,1), stroke-width .25s ease, opacity .25s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setHovered(s.genre)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  );
                })}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="font-mono text-[30px] font-medium leading-none text-paper tabnum">{fmtNum(displayTotal)}</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                {mode === "pages" ? "pages read" : "books"}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-[240px] text-center text-[12px] leading-relaxed text-dim">
            {hovered
              ? `${hovered} — ${fmtNum(segments.find((s) => s.genre === hovered)?.value ?? 0)} ${mode === "pages" ? "pages" : "books"} (${Math.round((segments.find((s) => s.genre === hovered)?.frac ?? 0) * 100)}%)`
              : "Hover the ring or the ledger to isolate a genre."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={90} className="h-full">
        <div className="flex h-full flex-col rounded-lg border border-linesoft bg-pine/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-paper">Where the pages went</h3>
            <div className="flex rounded-md border border-line p-[3px]">
              {(["pages", "books"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`cursor-pointer rounded-[5px] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-200 ${
                    mode === m ? "bg-raise text-brass shadow-[inset_0_0_0_1px_rgba(226,169,78,.35)]" : "text-dim hover:text-fog"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {stats.length === 0 ? (
            <p className="py-10 text-center text-[13px] italic text-dim">Nothing read yet — the ledger is blank.</p>
          ) : (
            <ul className="divide-y divide-linesoft/70">
              {segments.map((s) => (
                <li
                  key={s.genre}
                  onMouseEnter={() => setHovered(s.genre)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group flex cursor-default items-center gap-3 px-2 py-[9px] transition-all duration-200 ${
                    hovered === s.genre ? "bg-moss" : ""
                  } ${hovered !== null && hovered !== s.genre ? "opacity-45" : ""}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="w-28 shrink-0 truncate text-[13px] font-medium text-paper sm:w-36">{s.genre}</span>
                  <span className="relative h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-ink/70">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: inView ? `${s.frac * 100}%` : "0%", background: s.color, opacity: 0.85 }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right font-mono text-[12px] text-fog tabnum">
                    {fmtNum(s.value)}
                    <span className="text-dim"> · {Math.round(s.frac * 100)}%</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
