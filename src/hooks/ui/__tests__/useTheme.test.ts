import { resolveIsDark } from '../useTheme';

describe('resolveIsDark', () => {
  it('returns true when preference is dark regardless of system', () => {
    expect(resolveIsDark('dark', false)).toBe(true);
    expect(resolveIsDark('dark', true)).toBe(true);
  });

  it('returns false when preference is light regardless of system', () => {
    expect(resolveIsDark('light', true)).toBe(false);
    expect(resolveIsDark('light', false)).toBe(false);
  });

  it('follows system scheme when preference is system', () => {
    expect(resolveIsDark('system', true)).toBe(true);
    expect(resolveIsDark('system', false)).toBe(false);
  });
});
