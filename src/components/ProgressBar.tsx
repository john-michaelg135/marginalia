import { useCallback, useRef, useState } from "react";

interface Props {
  value: number; // current page
  max: number; // total pages
  color?: string;
  tall?: boolean;
  ariaLabel: string;
  onChange: (page: number) => void; // live update while dragging
  onCommit?: (deltaPages: number) => void; // called once when a gesture ends
}

export default function ProgressBar({ value, max, color = "#e2a94e", tall = false, ariaLabel, onChange, onCommit }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef(value); // page at gesture start
  const lastRef = useRef(value);
  const [dragging, setDragging] = useState(false);

  const clampPage = (n: number) => Math.max(0, Math.min(max, n));

  const pageFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return clampPage(Math.round(pct * max));
    },
    [max]
  );

  const finishGesture = () => {
    setDragging(false);
    const delta = lastRef.current - anchorRef.current;
    if (delta !== 0) onCommit?.(delta);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    anchorRef.current = value;
    lastRef.current = value;
    setDragging(true);
    const page = pageFromClientX(e.clientX);
    lastRef.current = page;
    onChange(page);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const page = pageFromClientX(e.clientX);
    if (page !== lastRef.current) {
      lastRef.current = page;
      onChange(page);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clampPage(value + step);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clampPage(value - step);
    if (e.key === "PageUp") next = clampPage(value + 25);
    if (e.key === "PageDown") next = clampPage(value - 25);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = max;
    if (next !== null) {
      e.preventDefault();
      const delta = next - value;
      onChange(next);
      if (delta !== 0) onCommit?.(delta);
    }
  };

  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`page ${value} of ${max}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      onKeyDown={onKeyDown}
      className={`tick-track group relative w-full cursor-pointer touch-none select-none rounded-full bg-ink/80 ring-1 ring-linesoft transition-shadow ${
        tall ? "h-4" : "h-2.5"
      } ${dragging ? "ring-brass/60" : "hover:ring-line"}`}
    >
      {/* fill */}
      <div
        className="fill-sheen pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-150 ease-out"
        style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
      />
      {/* quarter markers */}
      {[25, 50, 75].map((q) => (
        <span key={q} className="pointer-events-none absolute top-0 z-[1] h-full w-px bg-ink/60" style={{ left: `${q}%` }} />
      ))}
      {/* handle */}
      <div
        className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-paper transition-transform duration-150 ${
          dragging ? "scale-125" : "scale-100 group-hover:scale-110 group-focus-visible:scale-110"
        } ${tall ? "h-5 w-5" : "h-4 w-4"}`}
        style={{ left: `${pct * 100}%`, borderColor: color, boxShadow: dragging ? `0 0 0 6px ${color}26` : "0 2px 8px rgba(0,0,0,.5)" }}
      />
    </div>
  );
}
