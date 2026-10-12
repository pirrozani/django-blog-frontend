// `created_at` is a `YYYY-MM-DD` date, which `Date` parses as UTC midnight:
// format it in UTC so it never shifts a day in the visitor's time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatBlogDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : dateFormat.format(parsed);
}

/** A one-line plain-text preview of `text`, cut at a word near `max` characters. */
export function excerpt(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const end = lastSpace > max * 0.6 ? lastSpace : max;
  return `${cut.slice(0, end).trimEnd()}…`;
}

/**
 * Plain-text paragraphs: split on blank lines, single line breaks kept.
 * Content stays text; nothing here is ever parsed as HTML.
 */
export function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n[ \t]*\r?\n/)
    .map((part) => part.replace(/^[\r\n]+|\s+$/g, ''))
    .filter((part) => part.trim() !== '');
}

/** Minutes to read `text` at about 230 words a minute, never less than 1. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
