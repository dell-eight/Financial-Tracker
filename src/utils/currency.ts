import { useAppStore } from '../store/app.store';

// ── Supported currencies ───────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso',   flag: '🇵🇭' },
  { code: 'USD', name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',     flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',      flag: '🇯🇵' },
  { code: 'SGD', name: 'Singapore Dollar',  flag: '🇸🇬' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar',   flag: '🇨🇦' },
  { code: 'INR', name: 'Indian Rupee',      flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won',  flag: '🇰🇷' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

// Narrow symbols used in compact / prefix display
const SYMBOLS: Record<string, string> = {
  PHP: '₱', USD: '$',  EUR: '€', GBP: '£',
  JPY: '¥', SGD: 'S$', AUD: 'A$', CAD: 'CA$',
  INR: '₹', KRW: '₩',
};

export function getCurrencySymbol(code: string): string {
  return SYMBOLS[code] ?? code;
}

// ── Formatters ─────────────────────────────────────────────────────────────────

// Cached formatters — Intl.NumberFormat construction is expensive in Hermes;
// reuse the same instance for the same currency code across all calls.
const _fullFormatters = new Map<string, Intl.NumberFormat>();

// Full format  →  ₱1,234.56  /  $1,234.56  /  ¥1,235
export function formatFull(n: number, code: string): string {
  let fmt = _fullFormatters.get(code);
  if (!fmt) {
    const fractionDigits = ['JPY', 'KRW'].includes(code) ? 0 : 2;
    fmt = new Intl.NumberFormat('en-US', {
      style:                 'currency',
      currency:              code,
      currencyDisplay:       'narrowSymbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    _fullFormatters.set(code, fmt);
  }
  return fmt.format(n);
}

// Compact format  →  ₱1.2K  /  ₱1.2M
export function formatCompact(n: number, code: string): string {
  const sym = getCurrencySymbol(code);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`;
  if (abs >= 1_000)     return `${sign}${sym}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${sym}${Math.round(abs)}`;
}

// ── Money input formatting ─────────────────────────────────────────────────────

// Formats a raw numeric string (no commas) for display inside a TextInput.
// "20000" → "20,000"  |  "1234.56" → "1,234.56"  |  "" → ""
export function formatMoneyInput(raw: string): string {
  if (!raw) return '';
  const [integer, decimal] = raw.split('.');
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal !== undefined ? `${withCommas}.${decimal}` : withCommas;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useCurrency() {
  const code = useAppStore(s => s.currency);
  return {
    currency:    code,
    symbol:      getCurrencySymbol(code),
    fmt:         (n: number) => formatFull(n, code),
    fmtCompact:  (n: number) => formatCompact(n, code),
  };
}
