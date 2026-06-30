import { useEffect } from 'react';
import {
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

export interface StaggerConfig {
  /** Uniform delay between elements in ms. Ignored when `delays` is provided. Default: 80. */
  stepMs?: number;
  /** Explicit per-element delay values in ms. Overrides `stepMs` when set. */
  delays?: number[];
  /** Animation duration in ms — uniform value or per-element array. Default: 440. */
  duration?: number | number[];
}

// Maximum number of animated elements supported (covers all screens in the app)
const MAX = 8;

/**
 * Produces N staggered entrance-animation shared values (0 → 1).
 * Always calls exactly MAX hook invocations regardless of `count` to satisfy
 * the Rules of Hooks. Unused values stay at 0 and are excluded from the slice.
 */
export function useStaggeredAnimation(
  count: number,
  config: StaggerConfig = {},
): SharedValue<number>[] {
  const { stepMs = 80, delays, duration: rawDuration = 440 } = config;

  const v0 = useSharedValue(0);
  const v1 = useSharedValue(0);
  const v2 = useSharedValue(0);
  const v3 = useSharedValue(0);
  const v4 = useSharedValue(0);
  const v5 = useSharedValue(0);
  const v6 = useSharedValue(0);
  const v7 = useSharedValue(0);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    const all    = [v0, v1, v2, v3, v4, v5, v6, v7];
    for (let i = 0; i < count; i++) {
      const delay    = delays ? delays[i] : i * stepMs;
      const duration = Array.isArray(rawDuration) ? (rawDuration[i] ?? 440) : rawDuration;
      all[i].value   = withDelay(delay, withTiming(1, { duration, easing }));
    }
  // count and config values are constants per component mount — intentional omission
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [v0, v1, v2, v3, v4, v5, v6, v7].slice(0, count);
}
