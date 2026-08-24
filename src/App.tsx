import { useEffect, useMemo, useRef, useState } from "react";
import type { Book, Genre } from "./lib/data";
import {
  YEAR_GOAL,
  addDays,
  clearLedger,
  fmtNum,
  loadBooks,
  saveBooks,
  streakInfo,
  todayISO,
  totalsOf,
  uid,
} from "./lib/data";
import { useCountUp } from "./lib/hooks";
import { savePdf } from "./lib/pdfStore";
import { IconFlame, IconPlus, IconBookmark } from "./components/icons";
import { Reveal, SectionHead, ToastHost, type Toast } from "./components/ui";
import SpineShelf, { type ShelfGroup } from "./components/SpineShelf";
import Nightstand from "./components/Nightstand";
import PacePanel from "./components/PacePanel";
import Taste from "./components/Taste";
import Ledger from "./components/Ledger";
import { AddBookModal, BookDetailModal } from "./components/Modals";
import PdfReader from "./components/PdfReader";

/* --------------------------- intro stats --------------------------- */

function IntroStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const display = useCountUp(value, 1200);
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="font-mono text-[26px] font-medium leading-none text-paper tabnum sm:text-[30px]">
        {fmtNum(display)}
        {suffix && <span className="ml-0.5 text-[15px] text-dim">{suffix}</span>}
      </p>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{label}</p>
    </div>
  );
}

function GoalRing({ done, goal }: { done: number; goal: number }) {
  const R = 13;
  const C = 2 * Math.PI * R;
  const frac = Math.min(1, done / goal);
  return (
    <div className="flex items-center gap-2 rounded-full border border-linesoft bg-pine/70 py-1.5 pl-1.5 pr-3">
      <svg viewBox="0 0 34 34" className="h-7 w-7 -rotate-90">
        <circle cx="17" cy="17" r={R} fill="none" stroke="#26402f" strokeWidth="3.5" />
        <circle
          cx="17"
          cy="17"
          r={R}
          fill="none"
          stroke="#e2a94e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - frac * C}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span className="font-mono text-[11px] font-medium text-fog tabnum">
        {done}<span className="text-dim">/{goal} books</span>
      </span>
    </div>
  );
}

/* ------------------------------- app ------------------------------- */

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [readerBookId, setReaderBookId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const toastId = useRef(0);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => saveBooks(books), [books]);

  const totals = useMemo(() => totalsOf(books), [books]);
  const streak = useMemo(() => streakInfo(books), [books]);

  const pushToast = (msg: string, tone: Toast["tone"] = "brass") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  const patchBook = (id: string, fn: (b: Book) => Book) =>
    setBooks((bs) => bs.map((b) => (b.id === id ? fn(b) : b)));

  const clampPage = (b: Book, page: number) => Math.max(0, Math.min(b.pages, page));

  /* ------- handlers ------- */

  const liveProgress = (id: string, page: number) =>
    patchBook(id, (b) => ({ ...b, currentPage: clampPage(b, page), pdfLastPage: b.hasPdf ? clampPage(b, page) : b.pdfLastPage }));

  const commitDrag = (id: string, delta: number) => {
    if (delta > 0) {
      // Page was already moved by liveProgress — just log the session
      const today = todayISO();
      patchBook(id, (b) => {
        const has = b.sessions.some((s) => s.date === today);
        const sessions = has
          ? b.sessions.map((s) => (s.date === today ? { ...s, pages: s.pages + delta } : s))
          : [...b.sessions, { date: today, pages: delta }];
        const finishedNow = b.currentPage >= b.pages;
        return {
          ...b,
          sessions,
          status: finishedNow ? "finished" : b.status,
          finishedDate: finishedNow ? today : b.finishedDate,
        };
      });
      const book = books.find((b) => b.id === id);
      if (book) {
        const target = Math.min(book.currentPage + delta, book.pages);
        if (target >= book.pages) {
          pushToast(`★ ${book.title} finished — ${fmtNum(book.pages)} pages. Rate it in the ledger.`, "sage");
        } else {
          pushToast(`Logged ${delta} pages · p. ${target} of ${fmtNum(book.pages)} — ${fmtNum(book.pages - target)} to go.`, "sage");
        }
      }
    } else if (delta < 0) {
      const book = books.find((b) => b.id === id);
      pushToast(`Rewound to p. ${book?.currentPage ?? 0} — ${book?.title ?? ""}.`, "brass");
    }
  };

  const logPages = (id: string, n: number) => {
    const book = books.find((b) => b.id === id);
    if (!book || n === 0) return;
    const target = clampPage(book, book.currentPage + n);
    const actual = target - book.currentPage;
    if (actual === 0) {
      pushToast(n > 0 ? "That's the last page — finish it!" : "Already at page 0.", "ember");
      return;
    }
    const today = todayISO();

    patchBook(id, (b) => {
      const finishedNow = target >= b.pages;
      const sessions =
        actual > 0
          ? (() => {
              const has = b.sessions.some((s) => s.date === today);
              return has
                ? b.sessions.map((s) => (s.date === today ? { ...s, pages: s.pages + actual } : s))
                : [...b.sessions, { date: today, pages: actual }];
            })()
          : b.sessions;
      return {
        ...b,
        currentPage: target,
        pdfLastPage: b.hasPdf ? target : b.pdfLastPage,
        sessions,
        status: finishedNow ? "finished" : b.status,
        finishedDate: finishedNow ? today : b.finishedDate,
      };
    });

    if (target >= book.pages) {
      pushToast(`★ ${book.title} finished — ${fmtNum(book.pages)} pages. Rate it in the ledger.`, "sage");
    } else if (n > 0) {
      pushToast(`Logged ${n} pages · p. ${target} of ${fmtNum(book.pages)} — ${fmtNum(book.pages - target)} to go.`, "sage");
    }
  };

  const finishBook = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const today = todayISO();
    patchBook(id, (b) => {
      const extra = b.pages - b.currentPage;
      const has = b.sessions.some((s) => s.date === today);
      const sessions =
        extra > 0
          ? has
            ? b.sessions.map((s) => (s.date === today ? { ...s, pages: s.pages + extra } : s))
            : [...b.sessions, { date: today, pages: extra }]
          : b.sessions;
      return { ...b, status: "finished" as const, currentPage: b.pages, finishedDate: today, sessions };
    });
    pushToast(`★ ${book.title} is finished. How many stars?`, "brass");
  };

  const startBook = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    patchBook(id, (b) => ({ ...b, status: "reading", startDate: b.startDate ?? todayISO() }));
    setDetailId(null);
    pushToast(`${book.title} moved to the nightstand — pace tracking is live.`, "sage");
  };

  const rateBook = (id: string, n: number) => patchBook(id, (b) => ({ ...b, rating: n }));

  const attachPdf = (id: string, dataUrl: string) => {
    savePdf(id, dataUrl).then(() => {
      patchBook(id, (b) => ({ ...b, hasPdf: true }));
      pushToast("PDF attached — open the reader anytime from the book detail.", "sage");
    });
  };

  const openReader = (id: string) => {
    setDetailId(null);
    setReaderBookId(id);
  };

  const handleReaderPageChange = (page: number) => {
    if (readerBookId) {
      patchBook(readerBookId, (b) => ({ ...b, pdfLastPage: page }));
    }
  };

  const addBook = (data: { title: string; author: string; pages: number; genre: Genre; status: "reading" | "queue"; pdfFile?: string }) => {
    const bookId = uid();
    const book: Book = {
      id: bookId,
      title: data.title,
      author: data.author,
      pages: data.pages,
      genre: data.genre,
      status: data.status,
      currentPage: 0,
      startDate: data.status === "reading" ? todayISO() : undefined,
      sessions: [],
      hasPdf: !!data.pdfFile,
    };
    setBooks((bs) => [book, ...bs]);
    setAddOpen(false);

    if (data.pdfFile) {
      savePdf(bookId, data.pdfFile);
    }

    pushToast(`${data.title} shelved — ${data.status === "reading" ? "now on the nightstand." : "waiting in the queue."}`, "brass");
  };

  const resetLedger = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      resetTimer.current = window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    window.clearTimeout(resetTimer.current);
    setConfirmReset(false);
    clearLedger();
    setBooks([]);
    pushToast("Ledger cleared — a fresh start.", "brass");
  };

  /* ------- derived ------- */

  const detailBook = detailId ? books.find((b) => b.id === detailId) ?? null : null;
  const readerBook = readerBookId ? books.find((b) => b.id === readerBookId) ?? null : null;

  const shelfGroups: ShelfGroup[] = [
    { label: "On the nightstand", note: "in progress — tap a spine for its ledger card", books: totals.reading },
    { label: "Waiting their turn", note: "queued up and ready", books: totals.queue },
    { label: "Read & shelved", note: "finished this season", books: [...totals.finished].sort((a, b) => (b.finishedDate ?? "").localeCompare(a.finishedDate ?? "")) },
  ];

  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="grain" />
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      {/* ------------------------------ header ------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-linesoft bg-ink/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-2.5">
            <IconBookmark className="h-5 w-5 text-brass" />
            <span className="font-display text-[21px] font-bold italic tracking-tight text-paper">Marginalia</span>
            <span className="mt-1 hidden font-mono text-[9.5px] uppercase tracking-[0.24em] text-dim md:inline">
              reading ledger · {year}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <GoalRing done={totals.finished.length} goal={YEAR_GOAL} />
            <span className="hidden items-center gap-1.5 rounded-full border border-linesoft bg-pine/70 px-3 py-1.5 sm:flex" title="Consecutive reading days">
              <IconFlame className={`h-4 w-4 text-ember ${streak.current > 0 ? "flame-live" : "opacity-40"}`} />
              <span className="font-mono text-[11.5px] font-medium text-fog tabnum">{streak.current}</span>
            </span>
            <button
              onClick={() => setAddOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-brass px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
            >
              <IconPlus className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="hidden sm:inline">Add book</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5">
        {/* ------------------------------ opener ------------------------------ */}
        <section className="pb-12 pt-12 sm:pt-16">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Reveal>
              <p className="mb-4 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-brass">
                <span className="inline-block h-[5px] w-[5px] rotate-45 bg-brass" />
                A ledger of pages, pace &amp; taste
              </p>
              <h1 className="font-display text-[40px] font-bold leading-[1.03] tracking-tight text-paper sm:text-[54px]">
                Your reading year,
                <br />
                <em className="font-medium italic text-brass">measured in margins.</em>
              </h1>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-fog">
                Marginalia keeps the books on your nightstand, the speed you read them at, and the
                night you'll turn each last page — logged by hand, kept in your browser.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="grid grid-cols-3 gap-4 sm:gap-5">
                <IntroStat label="Finished" value={totals.finished.length} />
                <IntroStat label="Pages logged" value={totals.pagesLogged} />
                <IntroStat label="Day streak" value={streak.current} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------ shelf ------------------------------ */}
        <section className="pb-20">
          <SpineShelf groups={shelfGroups} onOpen={(id) => setDetailId(id)} />
        </section>

        {/* ---------------------------- nightstand ---------------------------- */}
        <section className="pb-24" id="nightstand">
          <SectionHead
            kicker="01 · The nightstand"
            title="Currently in progress"
            sub="Drag a bar or log a session — the finish date recalculates from your real reading speed, not a guess."
          />
          <Nightstand
            books={books}
            onLiveProgress={liveProgress}
            onCommitDrag={commitDrag}
            onLog={logPages}
            onFinish={finishBook}
            onOpen={setDetailId}
          />
        </section>

        {/* ------------------------------- pace ------------------------------- */}
        <section className="pb-24">
          <SectionHead
            kicker="02 · Pace"
            title="How fast the pages turn"
            sub="Thirty days of sessions, rolled into a rhythm. The sage line is your seven-day average."
          />
          <PacePanel books={books} />
        </section>

        {/* ------------------------------- taste ------------------------------ */}
        <section className="pb-24">
          <SectionHead
            kicker="03 · Taste"
            title="The shape of your shelf"
            sub="Every page you've logged this season, sorted by the worlds it came from."
          />
          <Taste books={books} />
        </section>

        {/* ------------------------------ ledger ------------------------------ */}
        <section className="pb-24">
          <SectionHead
            kicker="04 · Ledger"
            title="Finished & forthcoming"
            sub="The closed books with their ratings and read-times — and the queue waiting for its night."
          />
          <Ledger books={books} onRate={rateBook} onStart={startBook} onOpen={setDetailId} />
        </section>
      </main>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="relative z-10 border-t border-linesoft">
        <div className="mx-auto max-w-6xl px-5 py-10">
          {/* top row */}
          <div className="flex flex-wrap items-start justify-between gap-8">
            {/* brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <IconBookmark className="h-5 w-5 text-brass" />
                <span className="font-display text-[19px] font-bold italic tracking-tight text-paper">Marginalia</span>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-dim">
                A personal reading ledger. Track your pace, set goals, and read PDFs — all in one place. Your data stays in your browser.
              </p>
            </div>

            {/* links / info columns */}
            <div className="flex gap-12">
              <div>
                <p className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-fog">Reading</p>
                <ul className="space-y-1.5 text-[12.5px] text-dim">
                  <li>Goal: {YEAR_GOAL} books in {addDays(todayISO(), 0).slice(0, 4)}</li>
                  <li>{totals.finished.length} finished</li>
                  <li>{totals.reading.length} in progress</li>
                  <li>{totals.queue.length} queued</li>
                </ul>
              </div>
              <div>
                <p className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-fog">App</p>
                <ul className="space-y-1.5 text-[12.5px] text-dim">
                  <li>Local-first</li>
                  <li>No account needed</li>
                  <li>Works offline</li>
                  <li>
                    <a
                      href="https://github.com/john-michaelg135/marginalia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-brass"
                    >
                      Source on GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* divider */}
          <div className="my-6 h-px bg-linesoft" />

          {/* bottom row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[10.5px] text-dim">
              &copy; {new Date().getFullYear()} Marginalia. Built for readers, by a reader.
            </p>
            <button
              onClick={resetLedger}
              className={`cursor-pointer rounded-md border px-3.5 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 ${
                confirmReset
                  ? "border-ember/60 bg-ember/15 text-ember"
                  : "border-line text-dim hover:border-ember/50 hover:text-ember"
              }`}
            >
              {confirmReset ? "Tap again to confirm" : "Reset ledger"}
            </button>
          </div>
        </div>
      </footer>

      {/* ------------------------------ overlays ----------------------------- */}
      <ToastHost toasts={toasts} />
      {detailBook && (
        <BookDetailModal
          book={detailBook}
          books={books}
          onClose={() => setDetailId(null)}
          onLiveProgress={liveProgress}
          onCommitDrag={commitDrag}
          onLog={logPages}
          onFinish={finishBook}
          onStart={startBook}
          onRate={rateBook}
          onAttachPdf={attachPdf}
          onOpenReader={openReader}
        />
      )}
      {addOpen && <AddBookModal onClose={() => setAddOpen(false)} onAdd={addBook} />}
      {readerBookId && readerBook?.hasPdf && (
        <PdfReader
          book={readerBook}
          onClose={() => {
            const book = books.find((b) => b.id === readerBookId);
            if (book?.pdfLastPage && book.pdfLastPage > book.currentPage) {
              patchBook(book.id, (b) => ({ ...b, currentPage: b.pdfLastPage ?? b.currentPage }));
            }
            setReaderBookId(null);
          }}
          onPageChange={handleReaderPageChange}
        />
      )}
    </div>
  );
}
