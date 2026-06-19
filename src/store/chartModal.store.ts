import { create } from 'zustand';

export type ChartKey        = 'bar' | 'line' | 'donut' | 'networth';
export type AnalyticsPeriod = 'weekly' | 'monthly' | 'yearly';
export type NwPeriod        = 6 | 12 | 24;

function isAnalyticsPeriod(p: unknown): p is AnalyticsPeriod {
  return ['weekly', 'monthly', 'yearly'].includes(p as string);
}
function isNwPeriod(p: unknown): p is NwPeriod {
  return [6, 12, 24].includes(Number(p));
}

interface ChartModalStore {
  visible:         boolean;
  chartKey:        ChartKey;
  analyticsPeriod: AnalyticsPeriod;
  nwPeriod:        NwPeriod;
  open:               (key: ChartKey, initPeriod: AnalyticsPeriod | NwPeriod) => void;
  close:              () => void;
  reset:              () => void;
  setAnalyticsPeriod: (p: AnalyticsPeriod) => void;
  setNwPeriod:        (p: NwPeriod)        => void;
}

const INITIAL_STATE = {
  visible:         false,
  chartKey:        'bar' as ChartKey,
  analyticsPeriod: 'monthly' as AnalyticsPeriod,
  nwPeriod:        12 as NwPeriod,
};

export const useChartModalStore = create<ChartModalStore>(set => ({
  ...INITIAL_STATE,

  open: (key, initPeriod) => set({
    visible:  true,
    chartKey: key,
    analyticsPeriod:
      key !== 'networth' && isAnalyticsPeriod(initPeriod) ? initPeriod : 'monthly',
    nwPeriod:
      key === 'networth' && isNwPeriod(initPeriod) ? (Number(initPeriod) as NwPeriod) : 12,
  }),

  close: () => set({ visible: false }),
  reset: () => set({ ...INITIAL_STATE }),

  setAnalyticsPeriod: p => set({ analyticsPeriod: p }),
  setNwPeriod:        p => set({ nwPeriod: p }),
}));
