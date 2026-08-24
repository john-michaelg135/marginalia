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
}

export const YEAR_GOAL = 24;

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

/* ------------------------- seeded randomness ----------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uidCounter = 0;
export const uid = () => `bk_${Date.now().toString(36)}_${(uidCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Sessions spread between two dates that sum to exactly `total` pages. */
function spreadSessions(startISO: string, endISO: string, total: number, rnd: () => number): Session[] {
  const days = daysBetween(startISO, endISO) + 1;
  const dates: string[] = [];
  for (let i = 0; i < days; i++) dates.push(addDays(startISO, i));
  const active = dates.filter((_, i) => i === 0 || i === dates.length - 1 || rnd() < 0.78);
  const weights = active.map(() => 0.55 + rnd() * 0.9);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const sessions: Session[] = active.map((date, i) => ({
    date,
    pages: Math.max(2, Math.round((weights[i] / wSum) * total)),
  }));
  // fix rounding so pages sum exactly
  const drift = total - sessions.reduce((a, s) => a + s.pages, 0);
  if (sessions.length) {
    const last = sessions[sessions.length - 1];
    last.pages = Math.max(2, last.pages + drift);
  }
  return sessions;
}

/* ------------------------------ seed ------------------------------- */

export function makeSeed(): Book[] {
  const rnd = mulberry32(0x5eed26);
  const T = todayISO();
  const d = (n: number) => addDays(T, -n);

  const mk = (
    b: Omit<Book, "id" | "sessions" | "currentPage"> & { currentPage?: number },
    sessions: Session[]
  ): Book => ({
    ...b,
    id: uid(),
    sessions,
    currentPage: b.currentPage ?? sessions.reduce((a, s) => a + s.pages, 0),
  });

  const reading = (
    title: string,
    author: string,
    pages: number,
    genre: Genre,
    startedAgo: number,
    perDay: number,
    tilt?: boolean
  ): Book => {
    const start = d(startedAgo);
    const total = Math.min(
      pages - 24,
      Math.round(startedAgo * perDay * 0.82)
    );
    return mk(
      { title, author, pages, genre, status: "reading", startDate: start, tilt },
      spreadSessions(start, T, total, rnd)
    );
  };

  const finished = (
    title: string,
    author: string,
    pages: number,
    genre: Genre,
    finishedAgo: number,
    duration: number,
    rating: number,
    tilt?: boolean
  ): Book => {
    const end = d(finishedAgo);
    const start = addDays(end, -(duration - 1));
    return mk(
      {
        title, author, pages, genre,
        status: "finished",
        startDate: start,
        finishedDate: end,
        rating,
        tilt,
      },
      spreadSessions(start, end, pages, rnd)
    );
  };

  const queued = (title: string, author: string, pages: number, genre: Genre, tilt?: boolean): Book =>
    mk({ title, author, pages, genre, status: "queue", currentPage: 0, tilt }, []);

  return [
    // —— on the nightstand ——
    reading("The Overstory", "Richard Powers", 502, "Literary Fiction", 26, 21),
    reading("Piranesi", "Susanna Clarke", 245, "Fantasy", 9, 13, true),
    reading("The Wager", "David Grann", 329, "History", 14, 15),
    reading("Exhalation", "Ted Chiang", 350, "Science Fiction", 3, 16),

    // —— finished this season ——
    finished("The Left Hand of Darkness", "Ursula K. Le Guin", 304, "Science Fiction", 4, 9, 4),
    finished("Devotions", "Mary Oliver", 455, "Poetry", 12, 18, 5, true),
    finished("Educated", "Tara Westover", 334, "Memoir", 21, 12, 5),
    finished("The Name of the Rose", "Umberto Eco", 552, "Mystery", 31, 19, 4),
    finished("In Cold Blood", "Truman Capote", 343, "Nonfiction", 45, 11, 4),
    finished("Project Hail Mary", "Andy Weir", 476, "Science Fiction", 58, 15, 5, true),
    finished("The Remains of the Day", "Kazuo Ishiguro", 258, "Literary Fiction", 73, 10, 5),

    // —— waiting in the queue ——
    queued("The Secret History", "Donna Tartt", 559, "Literary Fiction", true),
    queued("Babel", "R. F. Kuang", 545, "Fantasy"),
    queued("SPQR", "Mary Beard", 606, "History"),
    queued("The Thursday Murder Club", "Richard Osman", 400, "Mystery"),
  ];
}

/* --------------------------- persistence --------------------------- */

const KEY = "marginalia.ledger.v1";

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && Array.isArray(parsed.books) && parsed.books.length) {
        return parsed.books as Book[];
      }
    }
  } catch {
    /* fall through to seed */
  }
  const seed = makeSeed();
  saveBooks(seed);
  return seed;
}

export function saveBooks(books: Book[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, books }));
  } catch {
    /* storage unavailable — keep in memory */
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
