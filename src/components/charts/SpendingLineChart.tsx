import React, { useEffect } from 'react';
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
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line as SvgLine,
} from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';

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

export function SpendingLineChart({
  data, chartW, chartH = 200, animDelay = 0,
}: {
  data:       LinePoint[];
  chartW:     number;
  chartH?:    number;
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, fontFamily: FF } = theme;
  const { fmtCompact: fmtK } = useCurrency();

  const PLOT_W = chartW - Y_LABEL_W;
  const PLOT_H = chartH - X_LABEL_H - Y_PAD;

  const rawMax  = Math.max(...data.map(d => d.value), 100);
  const Y_TICKS = 4;
  const yStep   = Math.ceil(rawMax / Y_TICKS / 100) * 100;
  const yMax    = yStep * Y_TICKS;
  const yLabels = Array.from({ length: Y_TICKS + 1 }, (_, i) => i * yStep);

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
    reveal.value = 0;
    reveal.value = withDelay(
      animDelay,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
    );
  }, [data]);

  const revealStyle = useAnimatedStyle(() => ({
    width: Math.max(1, reveal.value * PLOT_W),
  }));

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

      {/* Animated plot area */}
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
          {pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.chart.dataPoint} stroke={colors.chart.dataPointBorder} strokeWidth={2} />
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
          const x = (i / Math.max(data.length - 1, 1)) * PLOT_W;
          return (
            <View key={i} style={{ position: 'absolute', left: x - 20, width: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontFamily: FF.regular, color: colors.chart.axisLabel, textAlign: 'center' }}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
