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
