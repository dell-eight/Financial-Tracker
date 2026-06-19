import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import type { HomeStackParamList } from '../../navigation/types';
import { SUPPORT_EMAIL, APP_VERSION, APP_BUILD } from '../../constants/app';

type Props = StackScreenProps<HomeStackParamList, 'HelpSupport'>;

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, theme }: { title: string; theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text
      style={{
        fontSize:          fontSize.micro,
        fontFamily:        fontFamily.semiBold,
        color:             colors.text.muted,
        letterSpacing:     1.1,
        textTransform:     'uppercase',
        marginTop:         spacing[5],
        marginBottom:      spacing[2],
        paddingHorizontal: spacing[5],
      }}
    >
      {title}
    </Text>
  );
}

function MenuGroup({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  const { colors, borderRadius, spacing } = theme;
  return (
    <View
      style={{
        marginHorizontal: spacing[4],
        borderRadius:     borderRadius.lg,
        overflow:         'hidden',
        gap:              1,
        backgroundColor:  colors.border.subtle,
      }}
    >
      {children}
    </View>
  );
}

function SupportRow({
  icon,
  label,
  description,
  actionLabel,
  onPress,
  theme,
}: {
  icon:        string;
  label:       string;
  description: string;
  actionLabel: string;
  onPress:     () => void;
  theme:       ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        sc.row,
        {
          backgroundColor:   colors.bg.surface,
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[3],
          opacity:           pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          width:           36,
          height:          36,
          borderRadius:    borderRadius.sm,
          backgroundColor: colors.accent.muted,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     spacing[3],
        }}
      >
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize:   fontSize.bodyLg,
            fontFamily: fontFamily.medium,
            color:      colors.text.primary,
            lineHeight: 22,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize:   fontSize.bodyMd,
            fontFamily: fontFamily.regular,
            color:      colors.text.muted,
            lineHeight: 18,
            marginTop:  2,
          }}
        >
          {description}
        </Text>
      </View>

      <Text
        style={{
          fontSize:   fontSize.bodyMd,
          fontFamily: fontFamily.medium,
          color:      colors.accent.primary,
          marginLeft: spacing[2],
        }}
      >
        {actionLabel} ›
      </Text>
    </Pressable>
  );
}

function MenuItem({
  icon,
  label,
  value,
  chevron,
  onPress,
  theme,
}: {
  icon:     string;
  label:    string;
  value?:   string;
  chevron?: boolean;
  onPress?: () => void;
  theme:    ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        sc.row,
        {
          backgroundColor:   colors.bg.surface,
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[3],
          opacity:           pressed && onPress ? 0.75 : 1,
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View
        style={{
          width:           36,
          height:          36,
          borderRadius:    borderRadius.sm,
          backgroundColor: colors.accent.muted,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     spacing[3],
        }}
      >
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{icon}</Text>
      </View>

      <Text
        style={{
          flex:       1,
          fontSize:   fontSize.bodyLg,
          fontFamily: fontFamily.medium,
          color:      colors.text.primary,
        }}
      >
        {label}
      </Text>

      {value ? (
        <Text
          style={{
            fontSize:   fontSize.bodyMd,
            fontFamily: fontFamily.regular,
            color:      colors.text.muted,
            marginRight: chevron ? spacing[2] : 0,
          }}
        >
          {value}
        </Text>
      ) : null}

      {chevron ? (
        <Text style={{ fontSize: 18, color: colors.text.muted, lineHeight: 24 }}>›</Text>
      ) : null}
    </Pressable>
  );
}

function FAQItem({
  question,
  answer,
  theme,
}: {
  question: string;
  answer:   string;
  theme:    ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  const [open, setOpen] = useState(false);
  const rotation        = useSharedValue(0);

  function toggle() {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 1 : 0, { duration: 200 });
  }

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

  return (
    <View style={{ backgroundColor: colors.bg.surface }}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          sc.row,
          {
            paddingHorizontal: spacing[4],
            paddingVertical:   spacing[3],
            opacity:           pressed ? 0.75 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text
          style={{
            flex:       1,
            fontSize:   fontSize.bodyLg,
            fontFamily: fontFamily.medium,
            color:      colors.text.primary,
            lineHeight: 22,
            paddingRight: spacing[2],
          }}
        >
          {question}
        </Text>
        <Animated.Text
          style={[
            { fontSize: 18, color: colors.text.muted, lineHeight: 24 },
            chevronStyle,
          ]}
        >
          ›
        </Animated.Text>
      </Pressable>

      {open && (
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingBottom:     spacing[4],
            paddingTop:        spacing[1],
          }}
        >
          <Text
            style={{
              fontSize:   fontSize.bodyMd,
              fontFamily: fontFamily.regular,
              color:      colors.text.secondary,
              lineHeight: 20,
            }}
          >
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'How do I add a transaction?',
    answer:   'Tap the + button at the bottom of any screen. Select Expense, Income, or Transfer, fill in the amount, category, and date, then save.',
  },
  {
    question: 'How do savings goals work?',
    answer:   'Create a goal with a name, target amount, and optional emoji. Log contributions over time — each contribution optionally debits a linked account. Track progress with the circular progress indicator.',
  },
  {
    question: 'How is net worth calculated?',
    answer:   'Net worth = total assets (bank accounts + investment holdings + savings goal balances + real estate + vehicles + other) minus total liabilities (credit cards + loans + mortgages). It updates automatically as you log transactions and contributions.',
  },
  {
    question: 'How do I edit or delete a transaction?',
    answer:   'Go to Transactions, tap a transaction to open its detail screen, then use the edit or delete option at the top.',
  },
  {
    question: 'Is my data secure?',
    answer:   'Yes. Your data is encrypted in transit using SSL/TLS and stored securely on Supabase infrastructure. You can enable biometric lock in Profile > Security so only you can open the app.',
  },
  {
    question: 'Can I export my data?',
    answer:   'Yes. Go to Profile > Security Settings > Export Data to download your transactions, budget data, and net worth history in CSV, JSON, or PDF format.',
  },
];

// ── HelpSupportScreen ─────────────────────────────────────────────────────────

export function HelpSupportScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const appVersion = Constants.expoConfig?.version ?? APP_VERSION;
  const appBuild   = Platform.OS === 'ios'
    ? (Constants.expoConfig?.ios?.buildNumber ?? APP_BUILD)
    : String(Constants.expoConfig?.android?.versionCode ?? APP_BUILD);

  // ── Entrance animations ──────────────────────────────────────────────────
  const a0 = useSharedValue(0);
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 400, easing: Easing.out(Easing.cubic) };
    a0.value = withTiming(1, cfg);
    a1.value = withDelay(80,  withTiming(1, cfg));
    a2.value = withDelay(160, withTiming(1, cfg));
  }, []);

  const s0 = useAnimatedStyle(() => ({ opacity: a0.value, transform: [{ translateY: interpolate(a0.value, [0, 1], [12, 0]) }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: a1.value, transform: [{ translateY: interpolate(a1.value, [0, 1], [12, 0]) }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: a2.value, transform: [{ translateY: interpolate(a2.value, [0, 1], [12, 0]) }] }));

  return (
    <View style={[sc.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View
        style={[
          sc.header,
          {
            paddingTop:        topPad + spacing[1],
            paddingHorizontal: spacing[5],
            paddingBottom:     spacing[3],
            backgroundColor:   colors.bg.base,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
            ← Back
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize:   fontSize.headingMd,
            fontFamily: fontFamily.bold,
            color:      colors.text.primary,
          }}
        >
          Help &amp; Support
        </Text>

        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: btmPad + 80 }}
      >
        {/* ── Zone 1: subtitle ── */}
        <Animated.View style={s0}>
          <Text
            style={{
              fontSize:          fontSize.bodyMd,
              fontFamily:        fontFamily.regular,
              color:             colors.text.secondary,
              paddingHorizontal: spacing[5],
              marginTop:         spacing[4],
              lineHeight:        20,
            }}
          >
            Need help? We&apos;re here to assist you.
          </Text>
        </Animated.View>

        {/* ── Zone 2: GET HELP + FAQ ── */}
        <Animated.View style={s1}>
          {/* Support actions */}
          <SectionHeader title="Get Help" theme={theme} />
          <MenuGroup theme={theme}>
            <SupportRow
              icon="✉️"
              label="Contact Support"
              description="Reach out to our support team for assistance."
              actionLabel="Contact Us"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              theme={theme}
            />
            <SupportRow
              icon="🐛"
              label="Report a Bug"
              description="Found an issue? Let us know."
              actionLabel="Report Bug"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Bug%20Report`)}
              theme={theme}
            />
            <SupportRow
              icon="💡"
              label="Feature Request"
              description="Have an idea for improvement?"
              actionLabel="Submit Feedback"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Feature%20Request`)}
              theme={theme}
            />
          </MenuGroup>

          {/* FAQ */}
          <SectionHeader title="Frequently Asked Questions" theme={theme} />
          <MenuGroup theme={theme}>
            {FAQ_ITEMS.map((item, idx) => (
              <FAQItem
                key={idx}
                question={item.question}
                answer={item.answer}
                theme={theme}
              />
            ))}
          </MenuGroup>
        </Animated.View>

        {/* ── Zone 3: APP INFO ── */}
        <Animated.View style={s2}>
          {/* App info */}
          <SectionHeader title="App Information" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="📱"
              label="App Version"
              value={appVersion}
              theme={theme}
            />
            <MenuItem
              icon="🔢"
              label="Build Number"
              value={appBuild}
              theme={theme}
            />
          </MenuGroup>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    minHeight:     56,
  },
});

export default HelpSupportScreen;
