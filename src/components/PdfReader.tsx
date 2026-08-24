import { useCallback, useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import "../lib/pdfWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { Book } from "../lib/data";
import { GENRES } from "../lib/data";
import { loadPdf } from "../lib/pdfStore";
import { useEscape } from "../lib/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconBook,
} from "./icons";

interface Props {
  book: Book;
  onClose: () => void;
  onPageChange: (page: number) => void;
}

export default function PdfReader({ book, onClose, onPageChange }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(book.pdfLastPage ?? 1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const color = GENRES[book.genre].color;

  useEscape(onClose);

  // Load PDF from IndexedDB
  useEffect(() => {
    loadPdf(book.id).then((data) => {
      if (data) {
        setPdfData(data);
      } else {
        setError("PDF file not found.");
        setLoading(false);
      }
    }).catch(() => {
      setError("Failed to load PDF.");
      setLoading(false);
    });
  }, [book.id]);

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setLoading(false);
  };

  const goTo = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(numPages, page));
      setCurrentPage(clamped);
      onPageChange(clamped);
    },
    [numPages, onPageChange]
  );

  const prev = () => goTo(currentPage - 1);
  const next = () => goTo(currentPage + 1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, numPages]);

  const pct = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ink">
      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: `${color}40`, background: "rgba(16,28,22,0.95)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-6 items-center justify-center rounded-[3px]"
            style={{ background: `${color}cc` }}
          >
            <IconBook className="h-3.5 w-3.5 text-ink" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold text-paper">
              {book.title}
            </p>
            <p className="font-mono text-[10px] text-dim">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 rounded-full border border-linesoft bg-pine/70 px-2.5 py-1">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
              className="cursor-pointer font-mono text-[13px] font-bold text-fog transition-colors hover:text-paper"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="min-w-[3.2rem] text-center font-mono text-[11px] text-fog tabnum">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
              className="cursor-pointer font-mono text-[13px] font-bold text-fog transition-colors hover:text-paper"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close reader"
            className="cursor-pointer rounded-md border border-transparent p-1.5 text-dim transition-colors hover:border-line hover:bg-moss hover:text-paper"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* PDF view area */}
      <div className="relative flex-1 overflow-auto">
        <div className="flex min-h-full items-start justify-center py-6">
          {loading && (
            <div className="flex flex-col items-center gap-3 pt-24">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: `${color}60`, borderTopColor: "transparent" }}
              />
              <p className="font-mono text-[11px] text-dim">Loading PDF…</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-3 pt-24">
              <p className="font-mono text-[13px] text-ember">{error}</p>
            </div>
          )}
          {pdfData && (
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
              className={loading ? "invisible" : ""}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                className="shadow-card"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <footer
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: `${color}40`, background: "rgba(16,28,22,0.95)" }}
      >
        <button
          onClick={prev}
          disabled={currentPage <= 1}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-linesoft bg-moss px-3 py-1.5 font-mono text-[12px] text-fog transition-all hover:border-brass/60 hover:text-brass disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-linesoft disabled:hover:text-fog"
        >
          <IconChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="hidden w-48 items-center gap-2.5 sm:flex">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink/80 ring-1 ring-linesoft">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
          <span className="font-mono text-[12px] text-fog tabnum">
            <span className="text-paper">{currentPage}</span>
            <span className="text-dim"> / {numPages}</span>
          </span>
        </div>

        <button
          onClick={next}
          disabled={currentPage >= numPages}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-linesoft bg-moss px-3 py-1.5 font-mono text-[12px] text-fog transition-all hover:border-brass/60 hover:text-brass disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-linesoft disabled:hover:text-fog"
        >
          Next
          <IconChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
