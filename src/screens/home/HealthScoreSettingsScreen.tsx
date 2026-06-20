import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useHealthScore } from '../../hooks/queries/useHealthScore';
import { computeHealthScore, recommendScoreMode, SCORE_PRESETS } from '../../utils/healthScore';
import type { ScoreMode } from '../../utils/healthScore';
import { useAppStore } from '../../store/app.store';
import { saveScoreMode } from '../../services/security.service';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'HealthScoreSettings'>;

const MODES = Object.keys(SCORE_PRESETS) as ScoreMode[];

export function HealthScoreSettingsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const healthScoreMode    = useAppStore(s => s.healthScoreMode);
  const setHealthScoreMode = useAppStore(s => s.setHealthScoreMode);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  // Shared hook — factors come from the same React Query cache as the detail screen
  const { result: currentResult, factors } = useHealthScore(healthScoreMode);
  const currentScore = currentResult?.total ?? null;

  const recommended = useMemo(() => {
    if (!factors) return null;
    return recommendScoreMode(factors);
  }, [factors]);

  function handleSelect(mode: ScoreMode) {
    setHealthScoreMode(mode);
    saveScoreMode(mode).catch(() => {});
    navigation.goBack();
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Score Model
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + 40 }}>

        {/* Current score subheading */}
        {currentScore !== null && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[4], textAlign: 'center' }}>
            Your current score:{' '}
            <Text style={{ fontFamily: fontFamily.bold, color: colors.text.primary }}>{currentScore}</Text>
          </Text>
        )}

        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: spacing[3] }}>
          Choose a Model
        </Text>

        {MODES.map(mode => {
          const preset    = SCORE_PRESETS[mode];
          const isActive  = mode === healthScoreMode;
          const isRec     = recommended?.primary === mode;
          const modeScore = factors ? computeHealthScore(factors, mode).total : null;
          const delta     = modeScore !== null && currentScore !== null && !isActive
            ? modeScore - currentScore : null;

          return (
            <Pressable
              key={mode}
              onPress={() => handleSelect(mode)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.bg.surface,
                  borderRadius:    borderRadius.card,
                  borderWidth:     isActive ? 2 : 1,
                  borderColor:     isActive ? colors.accent.primary : colors.bg.surfaceMuted,
                  marginBottom:    spacing[3],
                  padding:         spacing[4],
                },
              ]}
            >
              {/* Top row: name + optional badge + score */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: isActive ? colors.accent.primary : colors.text.primary }}>
                      {preset.label}
                    </Text>
                    {isActive && (
                      <View style={{ backgroundColor: `${colors.accent.primary}20`, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
                          Active
                        </Text>
                      </View>
                    )}
                    {isRec && !isActive && (
                      <View style={{ backgroundColor: `${colors.income}20`, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.income }}>
                          Recommended
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                    {preset.tagline}
                  </Text>
                  {/* Show first reason on the recommended card */}
                  {isRec && !isActive && recommended?.reasons[0] && (
                    <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.income, marginTop: 2 }}>
                      {recommended.reasons[0]}
                    </Text>
                  )}
                </View>

                {/* Score preview */}
                {modeScore !== null && (
                  <View style={{ alignItems: 'flex-end', marginLeft: spacing[3] }}>
                    <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: isActive ? colors.accent.primary : colors.text.primary }}>
                      {modeScore}
                    </Text>
                    {delta !== null && (
                      <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.medium, color: delta >= 0 ? colors.income : colors.text.muted }}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Weight summary */}
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[1] }}>
                Savings {preset.weights.savings} · Emergency {preset.weights.emergency} · Debt {preset.weights.debt} · Goals {preset.weights.goal}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card:   { overflow: 'hidden' },
});

export default HealthScoreSettingsScreen;
