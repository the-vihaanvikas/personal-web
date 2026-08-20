/** Formatting helpers shared across the site. */

const nf = new Intl.NumberFormat('en-US');

export function formatNumber(n: number): string {
  return nf.format(Math.round(n));
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDecimal(n: number, digits = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${formatNumber(n)} ${n === 1 ? singular : pluralForm ?? singular + 's'}`;
}

/** "3 hours ago" style relative time. */
export function timeAgo(iso: string | Date, now = new Date()): string {
  const then = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Math.max(0, now.getTime() - then.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function formatDateLong(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateMedium(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/** Human duration between now and a future date, e.g. "in 8d 4h". */
export function countdown(target: Date, now = new Date()): string {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** "in 6 months" style future relative time. */
export function timeUntil(target: Date | string, now = new Date()): string {
  const t = typeof target === 'string' ? new Date(target) : target;
  const diff = Math.max(0, t.getTime() - now.getTime());
  const days = diff / 86400000;
  if (days < 1) return `in ${Math.max(1, Math.round(diff / 3600000))}h`;
  if (days < 60) return `in ${Math.round(days)}d`;
  if (days < 700) return `in ${Math.round(days / 30.44)}mo`;
  return `in ${Math.round(days / 365.25)}y`;
}

/** Pad a 2-digit number (used for SVG ids). */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
