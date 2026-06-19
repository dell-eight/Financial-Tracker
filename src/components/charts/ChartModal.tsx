import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/ui/useTheme';
import { ChartRenderer } from './ChartRenderer';
import type { ChartKey, AnalyticsPeriod, NwPeriod } from '../../store/chartModal.store';
import type { ChartData } from '../../hooks/ui/useChartData';

const MIN_BAR_PT_W  = 52;
const MIN_LINE_PT_W = 38;
const PAD           = 20;

interface Props {
  visible:                 boolean;
  chartKey:                ChartKey;
  chartData:               ChartData;
  analyticsPeriod:         AnalyticsPeriod;
  nwPeriod:                NwPeriod;
  onAnalyticsPeriodChange: (p: AnalyticsPeriod) => void;
  onNwPeriodChange:        (p: NwPeriod) => void;
  onClose:                 () => void;
}

export function ChartModal({
  visible,
  chartKey,
  chartData,
  analyticsPeriod,
  nwPeriod,
  onAnalyticsPeriodChange,
  onNwPeriodChange,
  onClose,
}: Props) {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme  = useTheme();
  const { colors, spacing, fontFamily, fontSize, borderRadius } = theme;

  const [chartH, setChartH] = useState(300);

  useEffect(() => {
    if (visible) setChartH(300);
  }, [visible]);

  const minDataW = Math.max(W - PAD * 2, 200);

  function getChartW(): number {
    switch (chartKey) {
      case 'bar':      return Math.max(minDataW, chartData.bar.length      * MIN_BAR_PT_W);
      case 'line':     return Math.max(minDataW, chartData.line.length     * MIN_LINE_PT_W);
      case 'donut':    return minDataW;
      case 'networth': return Math.max(minDataW, chartData.networth.length * 32);
    }
  }

  const chartW       = getChartW();
  const shouldScroll = chartW > W;
  const containerMinW = W;

  const chartTitle = {
    bar:      'Income vs Expenses',
    line:     'Spending Trends',
    donut:    'Category Breakdown',
    networth: 'Net Worth',
  }[chartKey];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          sc.root,
          {
            backgroundColor: colors.bg.base,
            paddingTop:      insets.top + 6,
            paddingBottom:   insets.bottom,
          },
        ]}
      >
        <StatusBar style={theme.statusBarStyle} hidden />

        {/* Header */}
        <View style={[sc.header, { paddingHorizontal: PAD }]}>
          <View style={sc.titleBlock}>
            <Text
              style={{
                fontFamily: fontFamily.semiBold,
                fontSize:   fontSize.headingMd,
                color:      colors.text.primary,
                lineHeight: 24,
              }}
            >
              {chartTitle}
            </Text>

            {/* Period pills — bar / line */}
            {(chartKey === 'bar' || chartKey === 'line') && (
              <View
                style={{
                  flexDirection:   'row',
                  backgroundColor: colors.bg.surface,
                  borderRadius:    borderRadius.full,
                  padding:         3,
                  alignSelf:       'flex-start',
                }}
              >
                {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                  <Pressable
                    key={p}
                    onPress={() => onAnalyticsPeriodChange(p)}
                    style={{
                      paddingHorizontal: spacing[3],
                      paddingVertical:   5,
                      borderRadius:      borderRadius.full,
                      backgroundColor:   analyticsPeriod === p ? colors.accent.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize:   fontSize.micro,
                        fontFamily: analyticsPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                        color:      analyticsPeriod === p ? '#FFFFFF' : colors.text.secondary,
                      }}
                    >
                      {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'Year'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Period pills — networth */}
            {chartKey === 'networth' && (
              <View
                style={{
                  flexDirection:   'row',
                  backgroundColor: colors.bg.surface,
                  borderRadius:    borderRadius.full,
                  padding:         3,
                  alignSelf:       'flex-start',
                }}
              >
                {([6, 12, 24] as const).map(p => (
                  <Pressable
                    key={p}
                    onPress={() => onNwPeriodChange(p)}
                    style={{
                      paddingHorizontal: spacing[3],
                      paddingVertical:   5,
                      borderRadius:      borderRadius.full,
                      backgroundColor:   nwPeriod === p ? colors.accent.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize:   fontSize.micro,
                        fontFamily: nwPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                        color:      nwPeriod === p ? '#FFFFFF' : colors.text.secondary,
                      }}
                    >
                      {p === 6 ? '6M' : p === 12 ? '1Y' : 'All'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[
              sc.closeBtn,
              {
                backgroundColor: colors.bg.surface,
                borderRadius:    borderRadius.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close chart"
          >
            <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20 }}>✕</Text>
          </Pressable>
        </View>

        {/* Chart area */}
        <View
          style={sc.chartArea}
          onLayout={e => setChartH(e.nativeEvent.layout.height)}
        >
          <ScrollView
            horizontal={shouldScroll}
            scrollEnabled={shouldScroll}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            decelerationRate="fast"
            contentContainerStyle={{
              minWidth:          containerMinW,
              paddingHorizontal: PAD,
              paddingVertical:   PAD,
              alignItems:        'center',
            }}
          >
            <ChartRenderer
              type={chartKey}
              data={chartData}
              width={chartW}
              height={chartH}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
  },
  titleBlock: {
    flex: 1,
    gap:  6,
  },
  chartArea: {
    flex: 1,
  },
  closeBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     12,
  },
});
