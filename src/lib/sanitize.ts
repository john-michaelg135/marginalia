/* ------------------------------------------------------------------ */
/*  Input sanitization & validation for XSS prevention                 */
/* ------------------------------------------------------------------ */

/**
 * Strip HTML tags and dangerous characters from user text input.
 * Prevents stored XSS if data is ever rendered outside React's escaping.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets (HTML tags)
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers like onclick=
    .replace(/data:\s*text\/html/gi, "") // Remove data:text/html URIs
    .trim();
}

/**
 * Validate that a string only contains safe characters for book metadata.
 * Allows letters, numbers, spaces, common punctuation.
 */
export function isValidBookText(input: string): boolean {
  // Allow most printable characters but block control characters and null bytes
  return !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);
}

/**
 * Sanitize a number input, ensuring it's finite and within bounds.
 */
export function sanitizeNumber(input: number, min: number, max: number): number {
  if (!Number.isFinite(input)) return min;
  return Math.max(min, Math.min(max, Math.round(input)));
}

/**
 * Validate a book object loaded from localStorage.
 * Returns null if the object is malformed or contains suspicious data.
 */
export function validateBookShape(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const b = obj as Record<string, unknown>;

  // Required string fields
  if (typeof b.id !== "string" || b.id.length > 100) return false;
  if (typeof b.title !== "string" || b.title.length > 500) return false;
  if (typeof b.author !== "string" || b.author.length > 500) return false;

  // Required number fields
  if (typeof b.pages !== "number" || !Number.isFinite(b.pages) || b.pages < 1 || b.pages > 100000) return false;
  if (typeof b.currentPage !== "number" || !Number.isFinite(b.currentPage) || b.currentPage < 0) return false;

  // Status must be one of the known values
  if (!["reading", "finished", "queue"].includes(b.status as string)) return false;

  // Genre validation
  const validGenres = [
    "Literary Fiction", "Science Fiction", "Fantasy", "Mystery",
    "Nonfiction", "History", "Memoir", "Poetry"
  ];
  if (!validGenres.includes(b.genre as string)) return false;

  // Sessions must be an array
  if (!Array.isArray(b.sessions)) return false;
  for (const s of b.sessions) {
    if (!s || typeof s !== "object") return false;
    if (typeof s.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) return false;
    if (typeof s.pages !== "number" || !Number.isFinite(s.pages) || s.pages < 0) return false;
  }

  // Optional fields type checks
  if (b.rating !== undefined && (typeof b.rating !== "number" || b.rating < 1 || b.rating > 5)) return false;
  if (b.startDate !== undefined && (typeof b.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.startDate))) return false;
  if (b.finishedDate !== undefined && (typeof b.finishedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.finishedDate))) return false;

  return true;
}
