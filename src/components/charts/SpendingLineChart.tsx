import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line as SvgLine,
} from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import { spendingTicks } from '../../utils/chartUtils';

export interface LinePoint { label: string; value: number }

const Y_LABEL_W = 44;
const X_LABEL_H = 28;
const Y_PAD     = 14;

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const t = 0.35;
    const cp1x = p.x + (c.x - p.x) * t;
    const cp2x = c.x - (c.x - p.x) * t;
    d += ` C ${cp1x.toFixed(2)},${p.y.toFixed(2)} ${cp2x.toFixed(2)},${c.y.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`;
  }
  return d;
}

export const SpendingLineChart = React.memo(function SpendingLineChart({
  data, chartW, chartH = 220, animDelay = 0,
}: {
  data:       LinePoint[];
  chartW:     number;
  chartH?:    number;
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, fontFamily: FF } = theme;
  const { fmtCompact: fmtK, fmt } = useCurrency();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const PLOT_W = chartW - Y_LABEL_W;
  const PLOT_H = chartH - X_LABEL_H - Y_PAD;

  const rawMax  = Math.max(...data.map(d => d.value), 100);
  const yLabels = spendingTicks(rawMax);
  // Guard against yMax=0 (e.g. all ticks collapsed to 0) to prevent NaN in path coords
  const yMax    = Math.max(yLabels[yLabels.length - 1] ?? 0, 1);

  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * PLOT_W,
    y: Y_PAD + (1 - Math.min(d.value, yMax) / yMax) * PLOT_H,
    label: d.label,
    value: d.value,
  }));

  const hasPts   = pts.length >= 2;
  const line     = hasPts ? smoothPath(pts) : '';
  const lastPt   = pts[pts.length - 1] ?? { x: 0, y: Y_PAD + PLOT_H };
  const fillPath = hasPts
    ? line + ` L ${lastPt.x.toFixed(2)},${(Y_PAD + PLOT_H).toFixed(2)} L 0,${(Y_PAD + PLOT_H).toFixed(2)} Z`
    : '';

  const reveal = useSharedValue(0);
  useEffect(() => {
    setSelectedIdx(null);
    reveal.value = 0;
    reveal.value = withDelay(
      animDelay,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
    );
  }, [data]);

  const revealStyle = useAnimatedStyle(() => ({
    width: Math.max(1, reveal.value * PLOT_W),
  }));

  // Pre-compute tooltip position (in parent View coords: origin = top-left of chart)
  let tooltipLeft  = 0;
  let tooltipTop   = 0;
  let tooltipW     = 108;
  let tooltipLabel = '';
  let tooltipValue = '';

  if (selectedIdx !== null && pts[selectedIdx]) {
    const pt  = pts[selectedIdx];
    tooltipValue = fmt(data[selectedIdx].value);
    tooltipLabel = data[selectedIdx].label;
    tooltipW = Math.max(108, Math.max(tooltipValue.length, tooltipLabel.length) * 7 + 16);

    // pt.x is relative to the Animated.View (which starts at Y_LABEL_W)
    const rawLeft = Y_LABEL_W + pt.x - tooltipW / 2;
    tooltipLeft   = Math.max(0, Math.min(rawLeft, chartW - tooltipW));

    // pt.y is relative to the top of the plot area (same as parent View top)
    const TOOLTIP_H = 44;
    const aboveFits = pt.y - TOOLTIP_H - 8 > 0;
    tooltipTop = aboveFits ? pt.y - TOOLTIP_H - 8 : pt.y + 12;
  }

  return (
    <View style={{ width: chartW, height: chartH }}>
      {/* Y-axis labels */}
      {yLabels.map((v, i) => {
        const y = Y_PAD + (1 - v / yMax) * PLOT_H;
        return (
          <Text
            key={i}
            style={{
              position: 'absolute', left: 0, top: y - 7,
              width: Y_LABEL_W - 4, textAlign: 'right',
              fontSize: 10, fontFamily: FF.regular, color: colors.chart.axisLabel,
            }}
          >
            {fmtK(v)}
          </Text>
        );
      })}

      {/* Animated plot area — overflow:hidden provides the reveal clip */}
      <Animated.View
        style={[
          revealStyle,
          { position: 'absolute', left: Y_LABEL_W, top: 0, height: chartH - X_LABEL_H, overflow: 'hidden' },
        ]}
      >
        <Svg width={PLOT_W} height={chartH - X_LABEL_H}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent.primary} stopOpacity="0.22" />
              <Stop offset="1" stopColor={colors.accent.primary} stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Dismiss zone behind all chart elements */}
          <Rect
            x={0} y={0} width={PLOT_W} height={chartH - X_LABEL_H}
            fill="transparent"
            onPress={() => setSelectedIdx(null)}
          />

          {yLabels.map((v, i) => {
            const y = Y_PAD + (1 - v / yMax) * PLOT_H;
            return (
              <SvgLine
                key={i} x1={0} y1={y} x2={PLOT_W} y2={y}
                stroke={colors.chart.gridLine} strokeWidth={1}
                strokeDasharray={v === 0 ? undefined : '4 4'} opacity={0.6}
              />
            );
          })}
          <Path d={fillPath} fill="url(#areaGrad)" />
          <Path d={line} stroke={colors.chart.lineStroke} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots — highlighted when selected */}
          {pts.map((p, i) => {
            const isSelected = selectedIdx === i;
            return (
              <Circle
                key={i}
                cx={p.x} cy={p.y}
                r={isSelected ? 6 : 4}
                fill={isSelected ? colors.accent.primary : colors.chart.dataPoint}
                stroke={isSelected ? colors.bg.base : colors.chart.dataPointBorder}
                strokeWidth={2}
              />
            );
          })}

          {/* Hit circles — rendered last inside SVG to win touch events */}
          {pts.map((p, i) => (
            <Circle
              key={`hit-${i}`}
              cx={p.x} cy={p.y}
              r={16}
              fill="transparent"
              onPress={() => setSelectedIdx(prev => prev === i ? null : i)}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* X-axis labels */}
      <View
        style={{
          position: 'absolute', left: Y_LABEL_W, bottom: 0,
          width: PLOT_W, height: X_LABEL_H,
          flexDirection: 'row', alignItems: 'flex-start', paddingTop: 6,
        }}
      >
        {data.map((d, i) => {
          const x       = (i / Math.max(data.length - 1, 1)) * PLOT_W;
          const isFirst = i === 0;
          const isLast  = i === data.length - 1;
          const left    = isFirst ? 0 : isLast ? PLOT_W - 40 : x - 20;
          const align   = isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center';
          return (
            <View key={i} style={{ position: 'absolute', left, width: 40, alignItems: align }}>
              <Text style={{ fontSize: 10, fontFamily: FF.regular, color: colors.chart.axisLabel, textAlign: 'center' }}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Tooltip — absolutely positioned outside Animated.View to avoid reveal clip */}
      {selectedIdx !== null && (
        <View
          style={{
            position: 'absolute',
            left: tooltipLeft,
            top: tooltipTop,
            width: tooltipW,
            height: 44,
            backgroundColor: colors.bg.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            paddingHorizontal: 8,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 9, fontFamily: FF.regular, color: colors.chart.axisLabel }} numberOfLines={1}>
            {tooltipLabel}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: FF.semiBold, color: colors.text.primary, marginTop: 2 }} numberOfLines={1}>
            {tooltipValue}
          </Text>
        </View>
      )}
    </View>
  );
});
