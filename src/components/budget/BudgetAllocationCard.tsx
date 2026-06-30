import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import { useCurrency } from '../../utils/currency';
import type { CategoryKey } from '../../theme';

// ── DonutChart ────────────────────────────────────────────────────────────────

const DONUT_SIZE = 156;
const OUTER_R    = 65;
const INNER_R    = 42;
const ARC_GAP    = 2.5;

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  a1: number, a2: number,
): string {
  const sweep = a2 - a1;
  if (sweep >= 360) { a2 = a1 + 359.98; }
  const large = (a2 - a1) > 180 ? 1 : 0;
  const p1 = polarToCart(cx, cy, outerR, a1);
  const p2 = polarToCart(cx, cy, outerR, a2);
  const p3 = polarToCart(cx, cy, innerR, a2);
  const p4 = polarToCart(cx, cy, innerR, a1);
  return [
    `M${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
    `A${outerR},${outerR},0,${large},1,${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
    `L${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
    `A${innerR},${innerR},0,${large},0,${p4.x.toFixed(2)},${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface DonutSegment { value: number; color: string; }

function DonutChart({ segments, holeFill }: { segments: DonutSegment[]; holeFill: string }) {
  const cx    = DONUT_SIZE / 2;
  const cy    = DONUT_SIZE / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let angle   = 0;
  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      {segments.map((seg, i) => {
        const sweep = (seg.value / total) * 360;
        const half  = sweep > ARC_GAP * 3 ? ARC_GAP / 2 : 0;
        const d     = buildArcPath(cx, cy, OUTER_R, INNER_R, angle + half, angle + sweep - half);
        angle      += sweep;
        return <Path key={i} d={d} fill={seg.color} />;
      })}
      <Circle cx={cx} cy={cy} r={INNER_R - 1} fill={holeFill} />
    </Svg>
  );
}

// ── BudgetAllocationCard ──────────────────────────────────────────────────────

export interface BudgetItem {
  id:       string;
  category: CategoryKey;
  label:    string;
  icon:     string;
  spent:    number;
  limit:    number;
  color:    string;
}

interface Props {
  items:          BudgetItem[];
  totalAllocated: number;
}

export function BudgetAllocationCard({ items, totalAllocated }: Props) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();

  const segments = items.map(b => ({ value: b.limit, color: b.color }));

  return (
    <View style={[styles.card, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5] }]}>
      <View style={styles.titleRow}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            Budget Allocation
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {fmt(totalAllocated)} across {items.length} categories
          </Text>
        </View>
        <View style={[styles.totalBadge, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.full }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
            {items.length} active
          </Text>
        </View>
      </View>

      <View style={[styles.chartRow, { marginTop: spacing[5] }]}>
        <View style={styles.donutContainer}>
          <DonutChart segments={segments} holeFill={colors.bg.surface} />
          <View style={styles.donutCenter} pointerEvents="none">
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>Total</Text>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', letterSpacing: -0.3, marginTop: 1 }}>
              {fmtShort(totalAllocated)}
            </Text>
          </View>
        </View>

        <View style={styles.legend}>
          {items.slice(0, 6).map((item, i) => (
            <View key={i} style={[styles.legendItem, { marginBottom: i < 5 ? 10 : 0 }]}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }} numberOfLines={1}>
                {item.label.split(' ')[0]}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginLeft: 4 }}>
                {Math.round((item.limit / totalAllocated) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.fullGrid, { marginTop: spacing[5], borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: spacing[4] }]}>
        {items.map((item, i) => (
          <View key={i} style={styles.gridItem}>
            <View style={[styles.gridDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.medium, color: colors.text.secondary }} numberOfLines={1}>{item.label}</Text>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>{fmt(item.limit)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  totalBadge: { paddingHorizontal: 10, paddingVertical: 5 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutContainer: { width: DONUT_SIZE, height: DONUT_SIZE, position: 'relative' },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  fullGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { flexDirection: 'row', alignItems: 'center', width: '47%', gap: 8 },
  gridDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
});
