import { useMemo, useRef, useState } from "react";
import type { Book, Genre } from "../lib/data";
import { GENRES, GENRE_LIST, fmtDate, fmtDateFull, fmtNum, paceOf, readDuration, todayISO } from "../lib/data";
import { IconBook, IconCalendar, IconCheck, IconFileText, IconGauge, IconPlus } from "./icons";
import { GenreChip, ModalShell, Stars } from "./ui";
import ProgressBar from "./ProgressBar";
import { pdfjs } from "../lib/pdfWorker";

/* ------------------------- session strip --------------------------- */

function SessionStrip({ book }: { book: Book }) {
  const last = useMemo(() => [...book.sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-10), [book]);
  if (!last.length) return null;
  const max = Math.max(...last.map((s) => s.pages), 1);
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Recent sessions</p>
      <div className="flex items-end gap-1.5">
        {last.map((s) => (
          <div key={s.date} className="group/bar flex flex-1 flex-col items-center gap-1" title={`${fmtDate(s.date)} — ${s.pages} pages`}>
            <span className="font-mono text-[9px] text-fog opacity-0 transition-opacity group-hover/bar:opacity-100 tabnum">{s.pages}</span>
            <span
              className="w-full rounded-[3px] transition-all duration-200 group-hover/bar:brightness-125"
              style={{
                height: `${8 + (s.pages / max) * 44}px`,
                background: s.date === todayISO() ? "#e2a94e" : "#48684f",
              }}
            />
            <span className="font-mono text-[8.5px] text-dim">{fmtDate(s.date).split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- book detail --------------------------- */

export function BookDetailModal({
  book,
  books,
  onClose,
  onLiveProgress,
  onCommitDrag,
  onLog,
  onFinish,
  onStart,
  onRate,
  onAttachPdf,
  onOpenReader,
}: {
  book: Book;
  books: Book[];
  onClose: () => void;
  onLiveProgress: (id: string, page: number) => void;
  onCommitDrag: (id: string, delta: number) => void;
  onLog: (id: string, pages: number) => void;
  onFinish: (id: string) => void;
  onStart: (id: string) => void;
  onRate: (id: string, n: number) => void;
  onAttachPdf: (id: string, dataUrl: string) => void;
  onOpenReader: (id: string) => void;
}) {
  const color = GENRES[book.genre].color;
  const pct = Math.round((book.currentPage / book.pages) * 100);
  const pace = book.status === "reading" ? paceOf(book, books) : null;
  const dur = readDuration(book);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAttachPdf(book.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <ModalShell onClose={onClose} labelledBy="book-detail-title" wide>
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4 sm:gap-5">
          <div
            className="flex h-24 w-16 shrink-0 items-start justify-center overflow-hidden rounded-[4px] rounded-t-[6px] pt-2 shadow-spine"
            style={{ background: `linear-gradient(100deg, ${color}e8, ${color}c4)`, boxShadow: `inset 2px 0 3px rgba(255,252,240,.3), inset -3px 0 6px rgba(12,21,18,.35), 0 10px 20px -8px rgba(0,0,0,.7)` }}
          >
            <span className="v-rl font-display text-[10px] font-semibold leading-tight text-ink/85">
              {book.title.slice(0, 30)}
            </span>
          </div>
          <div className="min-w-0 pr-8">
            <h2 id="book-detail-title" className="font-display text-2xl font-bold leading-[1.12] text-paper sm:text-[27px]">
              {book.title}
            </h2>
            <p className="mt-1 text-[14px] text-fog">{book.author}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <GenreChip genre={book.genre} />
              <span className="rounded-full border border-linesoft px-2.5 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog">
                {fmtNum(book.pages)} pages
              </span>
              <span
                className="rounded-full px-2.5 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.14em]"
                style={{
                  color: book.status === "reading" ? "#8fc7a0" : book.status === "finished" ? "#e2a94e" : "#a9bca8",
                  background: book.status === "reading" ? "rgba(143,199,160,.1)" : book.status === "finished" ? "rgba(226,169,78,.1)" : "rgba(169,188,168,.08)",
                }}
              >
                {book.status === "reading" ? "● reading now" : book.status === "finished" ? "finished" : "in queue"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* PDF attachment section */}
          <div className="flex items-center gap-2">
            {book.hasPdf ? (
              <button
                onClick={() => onOpenReader(book.id)}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-brass/50 bg-brass/10 px-4 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brass transition-all hover:-translate-y-px hover:bg-brass/20"
              >
                <IconBook className="h-4 w-4" />
                Open reader
              </button>
            ) : (
              <>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-linesoft bg-moss px-4 py-2.5 font-mono text-[12px] font-medium text-fog transition-all hover:-translate-y-px hover:border-brass/60 hover:text-brass"
                >
                  <IconFileText className="h-4 w-4" />
                  Attach PDF
                </button>
              </>
            )}
            {book.hasPdf && (
              <span className="font-mono text-[10px] text-dim">
                {book.pdfLastPage ? `Last read: page ${book.pdfLastPage}` : "PDF attached"}
              </span>
            )}
          </div>
          {book.status === "reading" && (
            <>
              <div>
                <div className="mb-2.5 flex items-end justify-between">
                  <p className="font-mono text-[24px] font-medium leading-none text-paper tabnum">
                    p.&thinsp;{book.currentPage}
                    <span className="ml-1.5 text-[13px] text-dim">of {fmtNum(book.pages)}</span>
                  </p>
                  <p className="font-mono text-[13px] font-medium tabnum" style={{ color }}>{pct}% · drag to adjust</p>
                </div>
                <ProgressBar
                  tall
                  value={book.currentPage}
                  max={book.pages}
                  color={color}
                  ariaLabel={`Progress for ${book.title}`}
                  onChange={(p) => onLiveProgress(book.id, p)}
                  onCommit={(d) => onCommitDrag(book.id, d)}
                />
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  {[-10, 10, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => onLog(book.id, n)}
                      className="cursor-pointer rounded-md border border-line bg-moss px-3.5 py-2 font-mono text-[12.5px] font-medium text-fog transition-all duration-150 hover:-translate-y-px hover:border-brass/60 hover:text-brass"
                    >
                      {n > 0 ? `+${n}` : n} pages
                    </button>
                  ))}
                  {book.currentPage < book.pages && (
                    <button
                      onClick={() => onFinish(book.id)}
                      className="ml-auto flex cursor-pointer items-center gap-2 rounded-md bg-sage/15 px-4 py-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sage ring-1 ring-sage/40 transition-all hover:bg-sage/25"
                    >
                      <IconCheck className="h-4 w-4" /> Finish book
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-linesoft bg-moss/60 p-4 text-[12.5px] sm:grid-cols-2">
                <p className="flex items-center gap-2.5 text-fog">
                  <IconGauge className="h-4 w-4 shrink-0 text-dim" />
                  {pace ? (
                    <>≈ <b className="font-mono text-paper tabnum">{pace.activePace.toFixed(0)}</b> pg per reading day</>
                  ) : (
                    "no pace yet"
                  )}
                </p>
                <p className="flex items-center gap-2.5 text-fog">
                  <IconCalendar className="h-4 w-4 shrink-0 text-dim" />
                  {pace && book.currentPage < book.pages ? (
                    <>est. finish <b className="font-mono text-brass">{fmtDateFull(pace.etaISO)}</b> · {pace.daysLeft} days</>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <SessionStrip book={book} />
            </>
          )}

          {book.status === "queue" && (
            <div className="rounded-md border border-linesoft bg-moss/60 p-5 text-center">
              <p className="font-display text-[17px] italic text-fog">
                Waiting its turn — {fmtNum(book.pages)} pages of {GENRES[book.genre].short.toLowerCase()} ahead.
              </p>
              <button
                onClick={() => onStart(book.id)}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-brass px-5 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-150 hover:-translate-y-px hover:brightness-110"
              >
                <IconBook className="h-4 w-4" /> Start reading tonight
              </button>
            </div>
          )}

          {book.status === "finished" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-linesoft bg-moss/60 p-4">
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">Your rating</p>
                  <Stars value={book.rating ?? 0} onChange={(n) => onRate(book.id, n)} size="h-6 w-6" />
                </div>
                <div className="text-right font-mono text-[12px] leading-relaxed text-fog tabnum">
                  {book.startDate && book.finishedDate ? (
                    <>
                      {fmtDate(book.startDate)} → {fmtDate(book.finishedDate)}
                      <span className="block text-dim">{dur && `${dur.days} days · ${dur.perDay.toFixed(0)} pg/day`}</span>
                    </>
                  ) : (
                    "dates unknown"
                  )}
                </div>
              </div>
              <SessionStrip book={book} />
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- add book ---------------------------- */

export function AddBookModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { title: string; author: string; pages: number; genre: Genre; status: "reading" | "queue"; pdfFile?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [genre, setGenre] = useState<Genre>("Literary Fiction");
  const [status, setStatus] = useState<"reading" | "queue">("queue");
  const [pdfFile, setPdfFile] = useState<string | undefined>(undefined);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfPages, setPdfPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setPdfName(file.name);

    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const detectedPages = pdf.numPages;
      setPdfPages(detectedPages);
      if (!pages) {
        setPages(String(detectedPages));
      }
    } catch {
      // PDF parsing failed — user can still enter pages manually
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPdfFile(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pages, 10);
    if (!title.trim()) return setError("Give the book a title.");
    if (!Number.isFinite(p) || p < 1 || p > 50000) return setError("Pages should be a number between 1 and 50,000.");
    onAdd({ title: title.trim(), author: author.trim() || "Unknown author", pages: p, genre, status, pdfFile });
  };

  const inputCls =
    "w-full rounded-md border border-line bg-ink/70 px-3.5 py-2.5 text-[14px] text-paper placeholder:text-dim/60 transition-colors focus:border-brass/60 focus:outline-none";

  return (
    <ModalShell onClose={onClose} labelledBy="add-book-title">
      <form onSubmit={submit} className="p-6 sm:p-7">
        <p className="mb-1 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-brass">
          <IconPlus className="h-3.5 w-3.5" /> New entry
        </p>
        <h2 id="add-book-title" className="font-display text-2xl font-bold text-paper">
          Add to the ledger
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="ab-title" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">Title *</label>
            <input id="ab-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Secret History" className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <div>
              <label htmlFor="ab-author" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">Author</label>
              <input id="ab-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Donna Tartt" className={inputCls} />
            </div>
            <div>
              <label htmlFor="ab-pages" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">
                Pages {!pdfFile && "*"}
                {pdfPages && <span className="ml-1.5 normal-case tracking-normal text-sage">· auto-detected from PDF</span>}
              </label>
              <input id="ab-pages" type="number" min={1} max={50000} value={pages} onChange={(e) => setPages(e.target.value)} placeholder={pdfFile ? "auto-detected" : "559"} className={inputCls} />
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">Genre</p>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_LIST.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-150 ${
                    genre === g ? "border-brass/60 bg-raise text-paper" : "border-linesoft text-dim hover:border-line hover:text-fog"
                  }`}
                >
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: GENRES[g].color }} />
                  {GENRES[g].short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">Shelf</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["queue", "The queue", "save it for later"],
                  ["reading", "Nightstand", "start tracking pace now"],
                ] as const
              ).map(([val, label, note]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`cursor-pointer rounded-md border px-4 py-3 text-left transition-all duration-150 ${
                    status === val ? "border-brass/60 bg-raise" : "border-linesoft bg-moss/50 hover:border-line"
                  }`}
                >
                  <span className={`block font-display text-[15px] font-semibold ${status === val ? "text-brass" : "text-paper"}`}>{label}</span>
                  <span className="mt-0.5 block text-[11.5px] text-dim">{note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PDF attachment */}
          <div>
            <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim">PDF (optional)</p>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3 text-left transition-all duration-150 ${
                pdfFile
                  ? "border-sage/50 bg-sage/10"
                  : "border-linesoft bg-moss/50 hover:border-line"
              }`}
            >
              <IconFileText className={`h-4.5 w-4.5 shrink-0 ${pdfFile ? "text-sage" : "text-dim"}`} />
              <span className={`text-[13px] ${pdfFile ? "text-sage" : "text-dim"}`}>
                {pdfFile
                  ? `${pdfName}${pdfPages ? ` · ${pdfPages} pages detected` : ""}`
                  : "Attach a PDF — page count will be auto-detected"}
              </span>
            </button>
          </div>

          {error && <p className="rounded-md border border-ember/40 bg-ember/10 px-3.5 py-2.5 text-[13px] text-ember">{error}</p>}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-md bg-brass px-4 py-3 font-mono text-[12.5px] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
          >
            Shelve it
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
