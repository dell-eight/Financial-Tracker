import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';

export interface BarPoint { label: string; income: number; expense: number }

const X_LABEL_H = 28;

function AnimatedBar({
  progress, targetH, maxH, barW, color,
}: {
  progress: SharedValue<number>;
  targetH:  number;
  maxH:     number;
  barW:     number;
  color:    string;
}) {
  const style = useAnimatedStyle(() => {
    const h = Math.max(2, progress.value * targetH);
    return { height: h, marginTop: maxH - h };
  });
  return (
    <Animated.View
      style={[style, { width: barW, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]}
    />
  );
}

export const GroupedBarChart = React.memo(function GroupedBarChart({
  data, chartW, chartH = 200, animDelay = 0,
}: {
  data:       BarPoint[];
  chartW:     number;
  chartH?:    number;
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, spacing, fontFamily } = theme;
  const { fmt } = useCurrency();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const BAR_PLOT_H = chartH - X_LABEL_H;
  const N          = data.length;
  const maxVal     = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const GROUP_W    = Math.floor(chartW / N);
  const BAR_W      = Math.floor((GROUP_W - 8) / 2);
  const BAR_GAP    = 3;

  const progress = useSharedValue(0);

  useEffect(() => {
    setSelectedIdx(null);
    progress.value = 0;
    progress.value = withDelay(
      animDelay,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [data]);

  // Pre-compute tooltip position
  const TW = 152;
  let tooltipLeft = 0;
  if (selectedIdx !== null) {
    const cx = selectedIdx * GROUP_W + GROUP_W / 2;
    tooltipLeft = Math.max(4, Math.min(cx - TW / 2, chartW - TW - 4));
  }

  return (
    <Pressable onPress={() => setSelectedIdx(null)} style={{ width: chartW }}>
      {/* Bars */}
      <View style={{ flexDirection: 'row', height: BAR_PLOT_H, alignItems: 'flex-end' }}>
        {data.map((d, i) => {
          const incH = (d.income  / maxVal) * BAR_PLOT_H;
          const expH = (d.expense / maxVal) * BAR_PLOT_H;
          return (
            <Pressable
              key={i}
              onPress={() => setSelectedIdx(prev => prev === i ? null : i)}
              style={{
                width:             GROUP_W,
                height:            BAR_PLOT_H,
                flexDirection:     'row',
                alignItems:        'flex-end',
                paddingHorizontal: 2,
                gap:               BAR_GAP,
                opacity:           selectedIdx !== null && selectedIdx !== i ? 0.3 : 1,
              }}
            >
              <AnimatedBar progress={progress} targetH={incH} maxH={BAR_PLOT_H} barW={BAR_W} color={colors.income} />
              <AnimatedBar progress={progress} targetH={expH} maxH={BAR_PLOT_H} barW={BAR_W} color={colors.expense} />
            </Pressable>
          );
        })}
      </View>

      {/* Tooltip — pinned to top of bars area, horizontally centered on selected group */}
      {selectedIdx !== null && (
        <View
          pointerEvents="none"
          style={{
            position:          'absolute',
            top:               4,
            left:              tooltipLeft,
            width:             TW,
            backgroundColor:   colors.bg.surface,
            borderRadius:      8,
            borderWidth:       1,
            borderColor:       colors.border.subtle,
            paddingHorizontal: 8,
            paddingVertical:   6,
            shadowColor:       '#000',
            shadowOffset:      { width: 0, height: 2 },
            shadowOpacity:     0.1,
            shadowRadius:      4,
            elevation:         3,
          }}
        >
          <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel, marginBottom: 3 }}>
            {data[selectedIdx].label}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.income }} />
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.secondary }}>Income</Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.income }}>
              {fmt(data[selectedIdx].income)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.expense }} />
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.secondary }}>Expense</Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.expense }}>
              {fmt(data[selectedIdx].expense)}
            </Text>
          </View>
        </View>
      )}

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', height: X_LABEL_H, alignItems: 'flex-start', paddingTop: 6 }}>
        {data.map((d, i) => (
          <View key={i} style={{ width: GROUP_W, alignItems: 'center' }}>
            <Text style={{
              fontSize:   10,
              fontFamily: fontFamily.regular,
              color:      selectedIdx === i ? colors.text.primary : colors.chart.axisLabel,
            }}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[5], marginTop: spacing[2] }}>
        {([
          { color: colors.income,  label: 'Income'   },
          { color: colors.expense, label: 'Expenses' },
        ] as const).map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 11, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
});
