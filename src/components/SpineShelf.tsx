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
  // Height and width scale logarithmically with page count for realistic proportions
  // A 50-page booklet is thin and short; a 1000-page tome is thick and tall
  const pages = book.pages;
  const height = Math.round(120 + Math.log(pages + 1) * 18); // ~120px at 1pg, ~180px at 600pg, ~195px at 1500pg
  const width = Math.round(38 + Math.sqrt(pages) * 1.2); // ~40px at 4pg, ~52px at 150pg, ~76px at 1000pg
  const clampedWidth = Math.max(42, Math.min(80, width));
  const clampedHeight = Math.max(120, Math.min(210, height));
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
      className={`group/spine relative flex shrink-0 cursor-pointer items-start justify-start rounded-[3px] rounded-t-[5px] transition-transform duration-300 ease-out hover:z-10 hover:-translate-y-2.5 focus-visible:-translate-y-2.5 ${
        book.tilt ? "origin-bottom-right -rotate-[4deg] hover:-rotate-[1deg]" : ""
      } ${book.status === "queue" ? "opacity-75 saturate-[0.72] hover:opacity-100 hover:saturate-100" : ""}`}
      style={{
        height: clampedHeight,
        width: clampedWidth,
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

      {/* hover tooltip - positioned to the right to avoid clipping */}
      <span className="pointer-events-none absolute left-full top-0 z-20 ml-2.5 w-max max-w-[220px] rounded-md border border-line bg-raise px-3 py-2.5 text-left opacity-0 shadow-card transition-[opacity] duration-200 group-hover/spine:opacity-100 group-focus-visible/spine:opacity-100">
        <span className="line-clamp-2 block font-display text-[13px] font-semibold leading-tight text-paper">{book.title}</span>
        <span className="mt-0.5 block text-[11px] text-fog">{book.author}</span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-linesoft px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: g.color }} />
            {g.short}
          </span>
          <span className="font-mono text-[9px] text-dim">{book.pages} pg</span>
        </span>
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
              <div className="-mt-16 overflow-x-auto pb-1 [scrollbar-width:thin]" style={{ minHeight: "230px" }}>
                <div className="w-max min-w-full">
                  <div className="flex min-h-[230px] items-end gap-[6px] px-1 pt-24">
                    {grp.books.map((b, i) => (
                      <Spine key={b.id} book={b} onOpen={onOpen} index={i} />
                    ))}
                  </div>
                  <div className="shelf-board" />
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden">
                {/* Cobweb decorations */}
                <svg className="pointer-events-none absolute top-0 left-0 h-16 w-16 opacity-[0.12]" viewBox="0 0 60 60">
                  <path d="M0 0 Q30 5, 60 0 M0 0 Q5 30, 0 60 M0 0 Q25 25, 50 50 M0 0 Q15 8, 30 10 M0 0 Q8 15, 10 30" fill="none" stroke="#a9bca8" strokeWidth="0.8" />
                  <path d="M5 0 Q20 15, 5 30 M0 5 Q15 20, 30 5" fill="none" stroke="#a9bca8" strokeWidth="0.5" strokeDasharray="2 3" />
                </svg>
                <svg className="pointer-events-none absolute top-0 right-0 h-16 w-16 -scale-x-100 opacity-[0.12]" viewBox="0 0 60 60">
                  <path d="M0 0 Q30 5, 60 0 M0 0 Q5 30, 0 60 M0 0 Q25 25, 50 50 M0 0 Q15 8, 30 10 M0 0 Q8 15, 10 30" fill="none" stroke="#a9bca8" strokeWidth="0.8" />
                  <path d="M5 0 Q20 15, 5 30 M0 5 Q15 20, 30 5" fill="none" stroke="#a9bca8" strokeWidth="0.5" strokeDasharray="2 3" />
                </svg>
                <svg className="pointer-events-none absolute bottom-3 right-12 h-10 w-10 opacity-[0.08]" viewBox="0 0 40 40">
                  <path d="M40 0 Q20 10, 0 40 M40 0 Q30 20, 40 40 M40 0 Q25 5, 10 10" fill="none" stroke="#a9bca8" strokeWidth="0.7" />
                </svg>
                {/* Dust particles */}
                <div className="pointer-events-none absolute top-8 left-[20%] h-1 w-1 rounded-full bg-fog/20 dust-particle" />
                <div className="pointer-events-none absolute top-14 left-[55%] h-0.5 w-0.5 rounded-full bg-fog/15 dust-particle" style={{ animationDelay: "2s" }} />
                <div className="pointer-events-none absolute top-10 left-[75%] h-1 w-1 rounded-full bg-fog/10 dust-particle" style={{ animationDelay: "4.5s" }} />

                <div className="relative flex items-end px-1 pb-0" style={{ height: "230px" }}>
                  {/* Ghost - each shelf gets unique timing via gi index */}
                  <div
                    className="ghost-x pointer-events-none absolute z-10"
                    style={{
                      top: "90px",
                      left: "3%",
                      animationDuration: `${17 + gi * 4}s`,
                      animationDelay: `${gi * -5}s`,
                    }}
                  >
                    <div
                      className="ghost-y"
                      style={{
                        animationDuration: `${11 + gi * 3}s`,
                        animationDelay: `${gi * -3}s`,
                      }}
                    >
                      <svg viewBox="0 0 32 40" className="h-14 w-12">
                        <path d="M16 3 C7 3, 3 10, 3 18 L3 31 Q7 27, 9 31 Q11 35, 13 31 Q15 27, 16 31 Q17 35, 19 31 Q21 27, 23 31 Q25 35, 27 31 Q29 27, 29 31 L29 18 C29 10, 25 3, 16 3 Z" fill="#4a5e50" opacity="0.7" />
                        <circle cx="11" cy="15" r="2.5" fill="#1a2b20" />
                        <circle cx="21" cy="15" r="2.5" fill="#1a2b20" />
                        <circle cx="12" cy="14" r="0.8" fill="#6f8773" />
                        <circle cx="22" cy="14" r="0.8" fill="#6f8773" />
                      </svg>
                    </div>
                  </div>
                  <span className="relative z-0 ml-3 self-end mb-1 font-mono text-[11px] italic text-dim/60">
                    no books here yet…
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
