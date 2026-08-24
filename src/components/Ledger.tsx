import { useState } from "react";
import type { Book } from "../lib/data";
import { GENRES, fmtDate, fmtNum, readDuration } from "../lib/data";
import { IconChevronRight } from "./icons";
import { GenreChip, Reveal, Stars } from "./ui";

type Tab = "finished" | "queue";

export default function Ledger({
  books,
  onRate,
  onStart,
  onOpen,
}: {
  books: Book[];
  onRate: (id: string, n: number) => void;
  onStart: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("finished");
  const finished = books
    .filter((b) => b.status === "finished")
    .sort((a, b) => (b.finishedDate ?? "").localeCompare(a.finishedDate ?? ""));
  const queue = books.filter((b) => b.status === "queue");
  const list = tab === "finished" ? finished : queue;

  return (
    <Reveal>
      <div className="overflow-hidden rounded-lg border border-linesoft bg-pine/80">
        <div className="flex items-center gap-1 border-b border-linesoft px-3 pt-3">
          {(
            [
              ["finished", `Finished · ${finished.length}`],
              ["queue", `In the queue · ${queue.length}`],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative cursor-pointer rounded-t-md px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.16em] transition-colors duration-200 ${
                tab === t ? "text-brass" : "text-dim hover:text-fog"
              }`}
            >
              {label}
              <span
                className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-brass transition-opacity duration-200 ${
                  tab === t ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="px-6 py-12 text-center text-[13.5px] italic text-dim">
            {tab === "finished" ? "No finished books yet — the margins await." : "The queue is empty. Add something tempting."}
          </p>
        ) : (
          <ul>
            {list.map((b, i) => {
              const dur = readDuration(b);
              return (
                <li
                  key={b.id}
                  className="group flex items-center gap-3 border-b border-linesoft/60 px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-moss/70 sm:gap-4 sm:px-5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span
                    className="h-9 w-[9px] shrink-0 rounded-[2px] shadow-[inset_1px_0_1px_rgba(255,255,255,.3)]"
                    style={{ background: GENRES[b.genre].color }}
                  />
                  <button onClick={() => onOpen(b.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <p className="truncate font-display text-[15.5px] font-semibold leading-tight text-paper transition-colors group-hover:text-brass">
                      {b.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-dim">{b.author}</p>
                  </button>

                  <span className="hidden md:block">
                    <GenreChip genre={b.genre} muted />
                  </span>

                  <span className="hidden w-16 shrink-0 text-right font-mono text-[12px] text-fog tabnum sm:block">
                    {fmtNum(b.pages)} pg
                  </span>

                  {tab === "finished" ? (
                    <>
                      <span className="hidden w-24 shrink-0 text-right font-mono text-[11.5px] text-dim tabnum lg:block">
                        {b.finishedDate ? fmtDate(b.finishedDate) : "—"}
                        {dur && <span className="block text-[10.5px] text-dim/70">{dur.days} d · {dur.perDay.toFixed(0)} pg/d</span>}
                      </span>
                      <span className="shrink-0">
                        <Stars value={b.rating ?? 0} onChange={(n) => onRate(b.id, n)} />
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => onStart(b.id)}
                      className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-brass/45 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brass transition-all duration-150 hover:-translate-y-px hover:bg-brass hover:text-ink"
                    >
                      Start <IconChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Reveal>
  );
}
