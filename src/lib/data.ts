/* ------------------------------------------------------------------ */
/*  Marginalia — data model, seed library & analytics math             */
/* ------------------------------------------------------------------ */

export type Genre =
  | "Literary Fiction"
  | "Science Fiction"
  | "Fantasy"
  | "Mystery"
  | "Nonfiction"
  | "History"
  | "Memoir"
  | "Poetry";

export type Status = "reading" | "finished" | "queue";

export interface Session {
  date: string; // ISO yyyy-mm-dd
  pages: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  genre: Genre;
  status: Status;
  currentPage: number;
  startDate?: string;
  finishedDate?: string;
  rating?: number; // 1..5
  tilt?: boolean; // leans on the shelf
  sessions: Session[];
  hasPdf?: boolean; // PDF stored in IndexedDB
  pdfLastPage?: number; // last page viewed in PDF reader
}

export const DEFAULT_YEAR_GOAL = 24;

const GOAL_KEY = "marginalia.goal.v1";

export function loadGoal(): number {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 500) return n;
    }
  } catch { /* noop */ }
  return DEFAULT_YEAR_GOAL;
}

export function saveGoal(goal: number) {
  try {
    localStorage.setItem(GOAL_KEY, String(Math.max(1, Math.min(500, Math.round(goal)))));
  } catch { /* noop */ }
}

export const GENRES: Record<Genre, { color: string; short: string }> = {
  "Literary Fiction": { color: "#e2a94e", short: "Fiction" },
  "Science Fiction": { color: "#7fb6ce", short: "Sci-Fi" },
  Fantasy: { color: "#b78bc4", short: "Fantasy" },
  Mystery: { color: "#de6a50", short: "Mystery" },
  Nonfiction: { color: "#8fc7a0", short: "Nonfic" },
  History: { color: "#c9a26b", short: "History" },
  Memoir: { color: "#d98ba0", short: "Memoir" },
  Poetry: { color: "#6fb5ae", short: "Poetry" },
};

export const GENRE_LIST = Object.keys(GENRES) as Genre[];

/* ----------------------------- dates ------------------------------ */

export const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);

export const fmtDate = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });

export const fmtDateFull = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

export const nf = new Intl.NumberFormat("en-US");
export const fmtNum = (n: number) => nf.format(Math.round(n));

let uidCounter = 0;
export const uid = () => `bk_${Date.now().toString(36)}_${(uidCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

import { sanitizeText, sanitizeNumber, validateBookShape } from "./sanitize";

/* --------------------------- persistence --------------------------- */

const KEY = "marginalia.ledger.v1";

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && Array.isArray(parsed.books)) {
        let needsMigration = false;
        const cleaned: Book[] = [];

        for (const b of parsed.books) {
          // Strip legacy pdfFile
          let book = b;
          if ("pdfFile" in book) {
            needsMigration = true;
            const { pdfFile, ...rest } = book;
            book = { ...rest, hasPdf: !!pdfFile };
          }

          // Validate shape — reject malformed entries
          if (!validateBookShape(book)) continue;

          // Sanitize text fields to prevent stored XSS
          book.title = sanitizeText(book.title);
          book.author = sanitizeText(book.author);
          book.pages = sanitizeNumber(book.pages, 1, 100000);
          book.currentPage = sanitizeNumber(book.currentPage, 0, book.pages);

          cleaned.push(book as Book);
        }

        if (needsMigration) {
          saveBooks(cleaned);
        }
        return cleaned;
      }
    }
  } catch {
    // If localStorage is corrupted or too large to parse, start fresh
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  }
  return [];
}

export function saveBooks(books: Book[]) {
  try {
    // Ensure no accidental PDF data leaks into localStorage
    const safe = books.map((b) => {
      if ("pdfFile" in b) {
        const { pdfFile, ...rest } = b as Book & { pdfFile?: string };
        return rest;
      }
      return b;
    });
    const json = JSON.stringify({ v: 1, books: safe });
    localStorage.setItem(KEY, json);
  } catch {
    // Quota exceeded — try clearing and re-saving
    try {
      localStorage.removeItem(KEY);
      const safe = books.map((b) => {
        if ("pdfFile" in b) {
          const { pdfFile, ...rest } = b as Book & { pdfFile?: string };
          return rest;
        }
        return b;
      });
      localStorage.setItem(KEY, JSON.stringify({ v: 1, books: safe }));
    } catch {
      console.warn("[Marginalia] Unable to persist data to localStorage.");
    }
  }
}

export function clearLedger() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/* ---------------------------- analytics ---------------------------- */

export interface PaceInfo {
  activePace: number; // pages per reading day (recent)
  calendarPace: number; // pages per calendar day (recent)
  remaining: number;
  daysLeft: number;
  etaISO: string;
}

const FALLBACK_PACE = 18;

export function paceOf(book: Book, books: Book[], windowDays = 14): PaceInfo | null {
  const cutoff = addDays(todayISO(), -windowDays);

  let actives = book.sessions.filter((s) => s.date >= cutoff && s.pages > 0);
  let pool = actives;
  if (actives.length < 2) {
    // fall back to the reader's overall recent rhythm
    const byDate = new Map<string, number>();
    for (const b of books)
      for (const s of b.sessions)
        if (s.date >= cutoff && s.pages > 0) byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.pages);
    pool = [...byDate.entries()].map(([date, pages]) => ({ date, pages })).sort((a, b) => a.date.localeCompare(b.date));
    actives = pool;
  }
  if (!actives.length) return null;

  const first = actives[0].date;
  const last = actives[actives.length - 1].date;
  const span = daysBetween(first, last) + 1;
  const sum = actives.reduce((a, s) => a + s.pages, 0);

  const activePace = sum / actives.length;
  const calendarPace = Math.max(4, sum / span);
  const remaining = Math.max(0, book.pages - book.currentPage);
  const daysLeft = Math.max(1, Math.ceil(remaining / calendarPace));

  return {
    activePace,
    calendarPace,
    remaining,
    daysLeft,
    etaISO: addDays(todayISO(), daysLeft),
  };
}

export interface DayTotal {
  date: string;
  pages: number;
}

export function activitySeries(books: Book[], days = 30): DayTotal[] {
  const T = todayISO();
  const start = addDays(T, -(days - 1));
  const map = new Map<string, number>();
  for (const b of books)
    for (const s of b.sessions)
      if (s.date >= start && s.date <= T) map.set(s.date, (map.get(s.date) ?? 0) + s.pages);
  const out: DayTotal[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    out.push({ date, pages: map.get(date) ?? 0 });
  }
  return out;
}

export function rollingAverage(series: DayTotal[], window = 7): (number | null)[] {
  return series.map((_, i) => {
    if (i < window - 1) return null;
    const slice = series.slice(i - window + 1, i + 1);
    return slice.reduce((a, s) => a + s.pages, 0) / window;
  });
}

export function streakInfo(books: Book[]): { current: number; longest: number } {
  const dates = new Set<string>();
  for (const b of books) for (const s of b.sessions) if (s.pages > 0) dates.add(s.date);

  const T = todayISO();
  let cursor = dates.has(T) ? T : addDays(T, -1);
  let current = 0;
  while (dates.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  const sorted = [...dates].sort();
  for (let i = 0; i < sorted.length; i++) {
    let run = 1;
    while (i + 1 < sorted.length && daysBetween(sorted[i], sorted[i + 1]) === 1) {
      run++;
      i++;
    }
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

export function avgWindow(series: DayTotal[], days: number, offsetDays = 0): number {
  const slice = series.slice(series.length - days - offsetDays, series.length - offsetDays);
  const sum = slice.reduce((a, s) => a + s.pages, 0);
  return sum / Math.max(1, days);
}

export interface GenreStat {
  genre: Genre;
  color: string;
  pages: number;
  books: number;
}

export function genreStats(books: Book[]): GenreStat[] {
  const map = new Map<Genre, GenreStat>();
  for (const b of books) {
    if (b.status === "queue") continue;
    const cur = map.get(b.genre) ?? { genre: b.genre, color: GENRES[b.genre].color, pages: 0, books: 0 };
    cur.pages += b.currentPage;
    cur.books += 1;
    map.set(b.genre, cur);
  }
  return [...map.values()].sort((a, b) => b.pages - a.pages);
}

export function totalsOf(books: Book[]) {
  let pagesLogged = 0;
  let sessionsCount = 0;
  for (const b of books) {
    pagesLogged += b.currentPage;
    sessionsCount += b.sessions.length;
  }
  const finished = books.filter((b) => b.status === "finished");
  const reading = books.filter((b) => b.status === "reading");
  const queue = books.filter((b) => b.status === "queue");
  const rated = finished.filter((b) => b.rating);
  const avgRating = rated.length ? rated.reduce((a, b) => a + (b.rating ?? 0), 0) / rated.length : 0;
  return { pagesLogged, sessionsCount, finished, reading, queue, avgRating };
}

export function readDuration(b: Book): { days: number; perDay: number } | null {
  if (!b.startDate || !b.finishedDate) return null;
  const days = daysBetween(b.startDate, b.finishedDate) + 1;
  return { days, perDay: b.pages / days };
}
