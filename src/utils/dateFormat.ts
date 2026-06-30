// Single source of truth for the display locale used across all date/number formatting.
// Update this constant when adding multi-locale support.
export const LOCALE = 'en-PH' as const;

export function fmtDateShort(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
}

export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function fmtDatePeriod(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

export function fmtDayLabel(d: Date): string {
  return d.toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtTimestamp(d: Date): string {
  return d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true });
}
