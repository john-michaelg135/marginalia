import type { Book } from "../lib/data";
import { GENRES, fmtDate } from "../lib/data";
import { Reveal } from "./ui";

export interface ShelfGroup {
  label: string;
  note: string;
  books: Book[];
}

function Spine({ book, onOpen, index }: { book: Book; onOpen: (id: string) => void; index: number }) {
  const g = GENRES[book.genre];
  const height = Math.round(108 + (book.pages / 606) * 72);
  const width = Math.round(Math.max(23, Math.min(42, 20 + book.pages / 28)));
  const pct = Math.round((book.currentPage / book.pages) * 100);

  const statusLine =
    book.status === "reading"
      ? `reading · p. ${book.currentPage} of ${book.pages} (${pct}%)`
      : book.status === "finished"
        ? `finished ${book.finishedDate ? fmtDate(book.finishedDate) : ""} · ${"★".repeat(book.rating ?? 0)}`
        : `in queue · ${book.pages} pages`;

  return (
    <button
      type="button"
      onClick={() => onOpen(book.id)}
      aria-label={`${book.title} by ${book.author} — ${statusLine}. Open details.`}
      title=""
      className={`group/spine relative flex shrink-0 cursor-pointer items-start justify-start overflow-hidden rounded-[3px] rounded-t-[5px] transition-all duration-300 ease-out hover:z-10 hover:-translate-y-2.5 focus-visible:-translate-y-2.5 ${
        book.tilt ? "origin-bottom-right -rotate-[4deg] hover:-rotate-[1deg]" : ""
      } ${book.status === "queue" ? "opacity-75 saturate-[0.72] hover:opacity-100 hover:saturate-100" : ""}`}
      style={{
        height,
        width,
        background: `linear-gradient(90deg, ${g.color}e8 0%, ${g.color} 18%, ${g.color}d9 78%, ${g.color}b3 100%)`,
        boxShadow: "inset 2px 0 3px rgba(255,252,240,.35), inset -3px 0 6px rgba(12,21,18,.38), 0 10px 18px -8px rgba(0,0,0,.7)",
        transitionDelay: `${index * 12}ms`,
      }}
    >
      {/* bands */}
      <span className="pointer-events-none absolute inset-x-[3px] top-2 h-[2px] bg-ink/35" />
      <span className="pointer-events-none absolute inset-x-[3px] top-[11px] h-px bg-ink/25" />
      <span className="pointer-events-none absolute inset-x-[3px] bottom-2 h-[2px] bg-ink/35" />

      {/* bookmark ribbon for books in progress */}
      {book.status === "reading" && (
        <span
          className="pointer-events-none absolute -top-px right-1.5 h-6 w-[7px] bg-[#efe9d8] shadow-[0_2px_4px_rgba(0,0,0,.4)]"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)" }}
        />
      )}

      {/* finished mark */}
      {book.status === "finished" && (
        <span className="pointer-events-none absolute bottom-3.5 left-1/2 -translate-x-1/2 font-mono text-[9px] leading-none text-ink/70">★</span>
      )}

      {/* spine text */}
      <span className="v-rl relative z-[1] flex max-h-full flex-col items-center gap-1.5 px-0 pt-4 text-ink/90">
        <span className="font-display text-[11px] font-semibold leading-[1.15] tracking-[0.02em] [overflow-wrap:anywhere]">
          {book.title.length > 26 ? book.title.slice(0, 25) + "…" : book.title}
        </span>
        <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-ink/60">
          {book.author.split(" ").slice(-1)[0]}
        </span>
      </span>

      {/* hover tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-line bg-raise px-3 py-2 text-left opacity-0 shadow-card transition-all duration-200 group-hover/spine:-translate-y-0.5 group-hover/spine:opacity-100 group-focus-visible/spine:opacity-100">
        <span className="line-clamp-2 block font-display text-[13px] font-semibold leading-tight text-paper">{book.title}</span>
        <span className="mt-0.5 block text-[11px] text-fog">{book.author}</span>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-brass">{statusLine}</span>
      </span>
    </button>
  );
}

export default function SpineShelf({ groups, onOpen }: { groups: ShelfGroup[]; onOpen: (id: string) => void }) {
  return (
    <div className="relative">
      {/* lamp light over the shelf */}
      <div
        className="pointer-events-none absolute -inset-x-8 -top-16 bottom-0 -z-[1]"
        style={{ background: "radial-gradient(58% 62% at 50% 0%, rgba(226,169,78,.09), transparent 70%)" }}
      />
      <div className="space-y-10">
        {groups.map((grp, gi) => (
          <Reveal key={grp.label} delay={gi * 90}>
            <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
              <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.24em] text-dim">
                {grp.label}
                <span className="ml-2 text-brass/80">{grp.books.length}</span>
              </p>
              <p className="hidden text-[12px] italic text-dim sm:block">{grp.note}</p>
            </div>
            {grp.books.length > 0 ? (
              <div className="-mt-16 overflow-x-auto pb-1 [scrollbar-width:thin]">
                <div className="w-max min-w-full">
                  <div className="flex items-end gap-[6px] px-1 pt-24">
                    {grp.books.map((b, i) => (
                      <Spine key={b.id} book={b} onOpen={onOpen} index={i} />
                    ))}
                  </div>
                  <div className="shelf-board" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-end gap-2 px-1 pt-4 pb-0">
                  {/* Ghost spines as placeholder */}
                  {[52, 68, 44, 60, 38, 56, 46].map((h, i) => (
                    <div
                      key={i}
                      className="shrink-0 rounded-[3px] rounded-t-[5px] opacity-[0.18]"
                      style={{
                        height: `${h}px`,
                        width: "16px",
                        background: "linear-gradient(90deg, #3d5a42, #26402f)",
                        boxShadow: "inset 1px 0 2px rgba(255,252,240,.08)",
                        animationName: "pulse-ghost",
                        animationDuration: `${2.4 + i * 0.3}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                  <span className="ml-3 self-center font-mono text-[11px] italic text-dim/60">
                    waiting for books…
                  </span>
                </div>
                <div className="shelf-board" />
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </div>
  );
}
