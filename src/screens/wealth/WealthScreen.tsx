import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import type { WealthStackParamList } from '../../navigation/types';
import { NetWorthTab }    from './tabs/NetWorthTab';
import { SavingsTab }     from './tabs/SavingsTab';
import { InvestmentsTab } from './tabs/InvestmentsTab';

type Props   = StackScreenProps<WealthStackParamList, 'WealthMain'>;
type SubTab  = 'networth' | 'savings' | 'investments';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'networth',     label: 'Net Worth'   },
  { key: 'savings',      label: 'Savings'     },
  { key: 'investments',  label: 'Investments' },
];

export function WealthScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [activeTab, setActiveTab] = useState<SubTab>('networth');
  const [headerStyle, tabsStyle, contentStyle] = useScreenAnimation(3);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[3], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, headerStyle]}>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4 }}>
          Wealth
        </Text>
      </Animated.View>

      {/* ── Sub-tab bar ── */}
      <Animated.View style={[styles.subTabBar, { paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, tabsStyle]}>
        <View style={[styles.subTabTrack, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3 }]}>
          {SUB_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.subTabItem,
                  {
                    borderRadius:      borderRadius.full,
                    backgroundColor:   active ? colors.bg.surfaceRaised : 'transparent',
                    paddingVertical:   spacing[2],
                    paddingHorizontal: spacing[3],
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                  color:      active ? colors.text.primary : colors.text.muted,
                }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Tab content ── */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        {activeTab === 'networth'    && <NetWorthTab    navigation={navigation} />}
        {activeTab === 'savings'     && <SavingsTab     navigation={navigation} />}
        {activeTab === 'investments' && <InvestmentsTab navigation={navigation} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  subTabBar: {
    width: '100%',
  },
  subTabTrack: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  subTabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default WealthScreen;
