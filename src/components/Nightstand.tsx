import { useState } from "react";
import type { Book } from "../lib/data";
import { GENRES, fmtNum, paceOf } from "../lib/data";
import { fmtDateFull } from "../lib/data";
import ProgressBar from "./ProgressBar";
import { IconArrowUpRight, IconCalendar, IconCheck, IconGauge } from "./icons";
import { GenreChip, Reveal } from "./ui";

interface CardProps {
  book: Book;
  books: Book[];
  onLiveProgress: (id: string, page: number) => void;
  onCommitDrag: (id: string, delta: number) => void;
  onLog: (id: string, pages: number) => void;
  onFinish: (id: string) => void;
  onOpen: (id: string) => void;
}

function ReadingCard({ book, books, onLiveProgress, onCommitDrag, onLog, onFinish, onOpen }: CardProps) {
  const [custom, setCustom] = useState("");
  const pace = paceOf(book, books);
  const pct = Math.round((book.currentPage / book.pages) * 100);
  const remaining = book.pages - book.currentPage;
  const color = GENRES[book.genre].color;

  const submitCustom = () => {
    const n = parseInt(custom, 10);
    if (Number.isFinite(n) && n > 0) {
      onLog(book.id, n);
      setCustom("");
    }
  };

  return (
    <article className="group flex h-full flex-col rounded-lg border border-linesoft bg-moss/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-line hover:bg-moss hover:shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <GenreChip genre={book.genre} />
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sage">
          <span className="dot-live inline-block h-[7px] w-[7px] rounded-full bg-sage" />
          reading
        </span>
      </div>

      <button
        onClick={() => onOpen(book.id)}
        className="group/title flex w-full cursor-pointer items-start justify-between gap-2 text-left"
      >
        <span>
          <h3 className="font-display text-[21px] font-semibold leading-[1.15] text-paper transition-colors group-hover/title:text-brass">
            {book.title}
          </h3>
          <p className="mt-1 text-[13px] text-fog">{book.author}</p>
        </span>
        <IconArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-dim opacity-0 transition-all duration-200 group-hover/title:translate-x-0.5 group-hover/title:text-brass group-hover/title:opacity-100" />
      </button>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-mono text-[26px] font-medium leading-none tracking-tight text-paper tabnum">
          p.&thinsp;{book.currentPage}
          <span className="ml-1.5 text-[14px] text-dim">/ {fmtNum(book.pages)}</span>
        </p>
        <p className="font-mono text-[13px] font-medium tabnum" style={{ color }}>
          {pct}%
        </p>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={book.currentPage}
          max={book.pages}
          color={color}
          ariaLabel={`Progress for ${book.title}`}
          onChange={(page) => onLiveProgress(book.id, page)}
          onCommit={(delta) => onCommitDrag(book.id, delta)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[10, 25].map((n) => (
          <button
            key={n}
            onClick={() => onLog(book.id, n)}
            className="cursor-pointer rounded-md border border-line bg-pine px-3 py-1.5 font-mono text-[12px] font-medium text-fog transition-all duration-150 hover:-translate-y-px hover:border-brass/60 hover:text-brass active:translate-y-0"
          >
            +{n} pages
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="37"
            aria-label="Custom pages read"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            className="w-14 rounded-md border border-line bg-ink/70 px-2 py-1.5 text-center font-mono text-[12px] text-paper placeholder:text-dim/60 focus:border-brass/60 focus:outline-none"
          />
          <button
            onClick={submitCustom}
            className="cursor-pointer rounded-md bg-raise px-3 py-1.5 font-mono text-[12px] font-medium text-paper transition-colors hover:bg-line"
          >
            Log
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-linesoft pt-3.5 text-[12.5px] leading-relaxed">
        <p className="flex items-center gap-2 text-fog">
          <IconGauge className="h-3.5 w-3.5 shrink-0 text-dim" />
          {pace ? (
            <>
              ≈ <span className="font-mono font-medium text-paper tabnum">{pace.activePace.toFixed(0)}</span> pg per
              reading day
            </>
          ) : (
            <span className="text-dim">no sessions yet — log pages to set a pace</span>
          )}
        </p>
        {remaining === 0 ? (
          <button
            onClick={() => onFinish(book.id)}
            className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-sage/15 px-3 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-sage ring-1 ring-sage/40 transition-all hover:bg-sage/25"
          >
            <IconCheck className="h-4 w-4" /> Mark finished
          </button>
        ) : pace ? (
          <p className="mt-1.5 flex items-center gap-2 text-fog">
            <IconCalendar className="h-3.5 w-3.5 shrink-0 text-dim" />
            on pace to finish{" "}
            <span className="font-mono font-medium text-brass">{fmtDateFull(pace.etaISO)}</span>
            <span className="text-dim">· {pace.daysLeft}d · {fmtNum(pace.remaining)} left</span>
          </p>
        ) : (
          <p className="mt-1.5 flex items-center gap-2 text-dim">
            <IconCalendar className="h-3.5 w-3.5 shrink-0" />
            log a session to project a finish date
          </p>
        )}
      </div>
    </article>
  );
}

export default function Nightstand({
  books,
  onLiveProgress,
  onCommitDrag,
  onLog,
  onFinish,
  onOpen,
}: {
  books: Book[];
  onLiveProgress: (id: string, page: number) => void;
  onCommitDrag: (id: string, delta: number) => void;
  onLog: (id: string, pages: number) => void;
  onFinish: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const reading = books.filter((b) => b.status === "reading");

  if (!reading.length) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-pine/60 px-6 py-10 text-center">
        <p className="font-display text-xl italic text-fog">The nightstand is clear.</p>
        <p className="mt-1 text-[13px] text-dim">Start something from the queue below to begin tracking pace.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {reading.map((b, i) => (
        <Reveal key={b.id} delay={i * 70} className="h-full">
          <ReadingCard
            book={b}
            books={books}
            onLiveProgress={onLiveProgress}
            onCommitDrag={onCommitDrag}
            onLog={onLog}
            onFinish={onFinish}
            onOpen={onOpen}
          />
        </Reveal>
      ))}
    </div>
  );
}
