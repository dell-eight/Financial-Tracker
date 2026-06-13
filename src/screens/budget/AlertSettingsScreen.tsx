import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useBudgets } from '../../hooks/queries/useBudgets';
import { getCategoryBgColor } from '../../theme';
import type { BudgetStackParamList } from '../../navigation/types';

type Props = StackScreenProps<BudgetStackParamList, 'AlertSettings'>;

// ─── SettingRow ───────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  isLast,
}: {
  icon:      string;
  title:     string;
  subtitle?: string;
  value:     boolean;
  onChange:  (v: boolean) => void;
  isLast?:   boolean;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;

  return (
    <View
      style={[
        rowStyles.row,
        {
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[4],
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <View style={[rowStyles.iconCircle, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, width: 36, height: 36 }]}>
        <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2, lineHeight: 18 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={v => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
        thumbColor={value ? colors.accent.primary : colors.text.muted}
        ios_backgroundColor={colors.bg.surfaceMuted}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center' },
  iconCircle:{ alignItems: 'center', justifyContent: 'center' },
});

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, paddingHorizontal: spacing[5], marginTop: spacing[6], marginBottom: spacing[2] }}>
      {title}
    </Text>
  );
}

// ─── AlertSettingsScreen ──────────────────────────────────────────────────────

export function AlertSettingsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const { data: budgets } = useBudgets();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  // Global alert toggles
  const [alert80,       setAlert80]       = useState(true);
  const [alert100,      setAlert100]      = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [pushEnabled,   setPushEnabled]   = useState(true);

  // Per-category alert toggles (all on by default)
  const [catAlerts, setCatAlerts] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    (budgets ?? []).forEach(b => { init[b.id] = true; });
    return init;
  });

  function toggleCat(id: string) {
    Haptics.selectionAsync();
    setCatAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const activeCount = Object.values(catAlerts).filter(Boolean).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Alert Settings
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Info banner ──────────────────────────────────────────────────────── */}
        <View style={[styles.banner, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[4] }]}>
          <Text style={{ fontSize: 16, marginRight: spacing[3] }}>🔔</Text>
          <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
            Alerts help you stay on top of your budget before you overspend. You can customize which alerts you receive below.
          </Text>
        </View>

        {/* ── Global alerts ────────────────────────────────────────────────────── */}
        <SectionTitle title="NOTIFICATIONS" />
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
          <SettingRow
            icon="📲"
            title="Push Notifications"
            subtitle="Allow budget alerts to appear on your device"
            value={pushEnabled}
            onChange={setPushEnabled}
          />
          <SettingRow
            icon="📋"
            title="Weekly Summary"
            subtitle="Receive a budget recap every Sunday morning"
            value={weeklySummary}
            onChange={setWeeklySummary}
            isLast
          />
        </View>

        {/* ── Threshold alerts ─────────────────────────────────────────────────── */}
        <SectionTitle title="BUDGET THRESHOLDS" />
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
          <SettingRow
            icon="⚠️"
            title="80% Warning"
            subtitle="Alert when a category reaches 80% of its budget"
            value={alert80}
            onChange={setAlert80}
          />
          <SettingRow
            icon="🚨"
            title="Over Budget Alert"
            subtitle="Alert immediately when spending exceeds the limit"
            value={alert100}
            onChange={setAlert100}
            isLast
          />
        </View>

        {/* ── Per-category alerts ───────────────────────────────────────────────── */}
        <SectionTitle title={`PER-CATEGORY ALERTS  ·  ${activeCount} active`} />
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
          {(budgets ?? []).map((b, i) => {
            const catColor = theme.categoryColors[b.category] ?? colors.accent.primary;
            const catBg    = getCategoryBgColor(b.category);
            const ratio    = b.limit > 0 ? b.spent / b.limit : 0;
            const isActive = catAlerts[b.id] ?? true;

            return (
              <View
                key={b.id}
                style={[
                  styles.catRow,
                  {
                    paddingHorizontal: spacing[4],
                    paddingVertical:   spacing[4],
                    borderBottomWidth: i < (budgets?.length ?? 0) - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
              >
                {/* Icon */}
                <View style={[styles.catIcon, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 36, height: 36 }]}>
                  <Text style={{ fontSize: 18, lineHeight: 22 }}>{b.icon}</Text>
                </View>

                {/* Labels */}
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: isActive ? colors.text.primary : colors.text.muted }}>
                    {b.label}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: ratio > 0.8 ? colors.warning : colors.text.muted, marginTop: 2 }}>
                    {Math.round(ratio * 100)}% used · limit {`₱${b.limit.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`}
                  </Text>
                </View>

                {/* Toggle */}
                <Switch
                  value={isActive}
                  onValueChange={() => toggleCat(b.id)}
                  trackColor={{ false: colors.bg.surfaceMuted, true: `${catColor}40` }}
                  thumbColor={isActive ? catColor : colors.text.muted}
                  ios_backgroundColor={colors.bg.surfaceMuted}
                />
              </View>
            );
          })}
        </View>

        {/* ── Bulk toggle ──────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[4], flexDirection: 'row', gap: spacing[3] }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              const next: Record<string, boolean> = {};
              (budgets ?? []).forEach(b => { next[b.id] = true; });
              setCatAlerts(next);
            }}
            style={[styles.bulkBtn, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.button, flex: 1, height: 40 }]}
          >
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>Enable All</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              const next: Record<string, boolean> = {};
              (budgets ?? []).forEach(b => { next[b.id] = false; });
              setCatAlerts(next);
            }}
            style={[styles.bulkBtn, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.button, flex: 1, height: 40, borderWidth: 1, borderColor: colors.border.subtle }]}
          >
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Disable All</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  banner:  { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  catRow:  { flexDirection: 'row', alignItems: 'center' },
  catIcon: { alignItems: 'center', justifyContent: 'center' },
  bulkBtn: { alignItems: 'center', justifyContent: 'center' },
});

export default AlertSettingsScreen;
