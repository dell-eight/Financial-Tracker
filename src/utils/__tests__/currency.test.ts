import { formatFull, formatCompact, getCurrencySymbol } from '../currency';

describe('getCurrencySymbol', () => {
  it('returns known symbols', () => {
    expect(getCurrencySymbol('PHP')).toBe('₱');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('JPY')).toBe('¥');
  });

  it('falls back to the code for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
});

describe('formatFull', () => {
  it('formats PHP with 2 decimal places', () => {
    expect(formatFull(1234.56, 'PHP')).toBe('₱1,234.56');
  });

  it('formats JPY with 0 decimal places', () => {
    expect(formatFull(1234, 'JPY')).toBe('¥1,234');
  });

  it('formats KRW with 0 decimal places', () => {
    expect(formatFull(5000, 'KRW')).toBe('₩5,000');
  });

  it('formats USD correctly', () => {
    expect(formatFull(0, 'USD')).toBe('$0.00');
  });
});

describe('formatCompact', () => {
  it('formats millions', () => {
    expect(formatCompact(1_500_000, 'USD')).toBe('$1.5M');
  });

  it('formats tens of thousands', () => {
    expect(formatCompact(25_000, 'USD')).toBe('$25K');
  });

  it('formats thousands with one decimal', () => {
    expect(formatCompact(1_500, 'USD')).toBe('$1.5K');
  });

  it('formats sub-thousand as whole number', () => {
    expect(formatCompact(999, 'USD')).toBe('$999');
  });

  it('handles negative values', () => {
    expect(formatCompact(-2_000, 'USD')).toBe('-$2.0K');
  });
});
