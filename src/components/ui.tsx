import type { CSSProperties, ReactNode } from "react";
import { GENRES, type Genre } from "../lib/data";
import { useEscape, useReveal } from "../lib/hooks";
import { IconStar, IconX } from "./icons";

/* ------------------------------ Reveal ----------------------------- */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* --------------------------- SectionHead --------------------------- */

export function SectionHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: ReactNode;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-brass">
          <span className="inline-block h-[5px] w-[5px] rotate-45 bg-brass" />
          {kicker}
        </p>
        <h2 className="font-display text-3xl font-semibold leading-[1.08] text-paper sm:text-4xl">{title}</h2>
        {sub && <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-fog">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </Reveal>
  );
}

/* ---------------------------- GenreChip ---------------------------- */

export function GenreChip({ genre, muted = false }: { genre: Genre; muted?: boolean }) {
  const g = GENRES[genre];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-linesoft px-2.5 py-[3px] font-mono text-[10.5px] uppercase tracking-[0.14em] ${
        muted ? "text-dim" : "text-fog"
      }`}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: g.color }} />
      {g.short}
    </span>
  );
}

/* ------------------------------ Stars ------------------------------ */

export function Stars({
  value,
  onChange,
  size = "h-4 w-4",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: string;
}) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            className="cursor-pointer text-brass transition-transform duration-150 hover:-translate-y-0.5 hover:scale-110"
          >
            <IconStar filled={n <= value} className={`${size} ${n <= value ? "" : "text-dim"}`} />
          </button>
        ) : (
          <IconStar key={n} filled={n <= value} className={`${size} ${n <= value ? "text-brass" : "text-dim/50"}`} />
        )
      )}
    </span>
  );
}

/* ------------------------------ Toasts ----------------------------- */

export interface Toast {
  id: number;
  msg: string;
  tone: "brass" | "sage" | "ember";
}

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="toast-in pointer-events-auto flex items-start gap-3 rounded-md border border-line bg-raise/95 px-4 py-3 shadow-card backdrop-blur-sm"
          style={{ borderLeft: `3px solid ${t.tone === "sage" ? "#8fc7a0" : t.tone === "ember" ? "#de6a50" : "#e2a94e"}` }}
        >
          <p className="text-[13.5px] leading-snug text-paper">{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- ModalShell --------------------------- */

export function ModalShell({
  onClose,
  children,
  labelledBy,
  wide = false,
}: {
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  wide?: boolean;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Close dialog"
        className="fade-in absolute inset-0 cursor-default bg-ink/78 backdrop-blur-[3px]"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`modal-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-pine shadow-card sm:rounded-xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 rounded-md border border-transparent p-1.5 text-dim transition-colors hover:border-line hover:bg-moss hover:text-paper"
        >
          <IconX className="h-4.5 w-4.5" />
        </button>
        {children}
      </div>
    </div>
  );
}
