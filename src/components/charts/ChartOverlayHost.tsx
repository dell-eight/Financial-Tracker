import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useChartModalStore } from '../../store/chartModal.store';
import { useChartData } from '../../hooks/ui/useChartData';
import { ChartModal } from './ChartModal';

// Inner component: always safe to call hooks (no early return above)
function ChartOverlayHostInner() {
  const {
    visible,
    chartKey,
    analyticsPeriod,
    nwPeriod,
    close,
    setAnalyticsPeriod,
    setNwPeriod,
  } = useChartModalStore();

  const chartData = useChartData({ analyticsPeriod, nwPeriod });

  return (
    <ChartModal
      visible={visible}
      chartKey={chartKey}
      chartData={chartData}
      analyticsPeriod={analyticsPeriod}
      nwPeriod={nwPeriod}
      onAnalyticsPeriodChange={setAnalyticsPeriod}
      onNwPeriodChange={setNwPeriod}
      onClose={close}
    />
  );
}

// Outer: auth guard prevents React Query subscriptions on unauthenticated screens
export function ChartOverlayHost() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return null;
  return <ChartOverlayHostInner />;
}
