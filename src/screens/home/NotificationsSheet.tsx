import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/queries/useNotifications';
import type { AppNotification } from '../../types/models';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'Notifications'>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const ICON: Record<AppNotification['type'], string> = {
  budget_warning: '⚠️',
  budget_over:    '🚨',
};

// ── Skeleton row ───────────────────────────────────────────────────────────────

function SkeletonRow({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, borderRadius } = theme;
  return (
    <View style={[styles.row, { paddingHorizontal: spacing[5], paddingVertical: spacing[4] }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full }]} />
      <View style={{ flex: 1, gap: spacing[1] }}>
        <View style={{ height: 14, width: '60%', borderRadius: 6, backgroundColor: colors.bg.surfaceMuted }} />
        <View style={{ height: 12, width: '85%', borderRadius: 6, backgroundColor: colors.bg.surfaceMuted }} />
      </View>
    </View>
  );
}

// ── Notification row ───────────────────────────────────────────────────────────

interface NotifRowProps {
  item:    AppNotification;
  onPress: (id: string) => void;
  theme:   ReturnType<typeof useTheme>;
}

function NotifRow({ item, onPress, theme }: NotifRowProps) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const isUnread = item.readAt === null;
  const iconBg   = item.type === 'budget_over' ? colors.expenseBg : colors.warningBg;

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing[5],
          paddingVertical:   spacing[4],
          backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.base,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${isUnread ? 'Unread. ' : ''}${item.body}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg, borderRadius: borderRadius.full }]}>
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{ICON[item.type]}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text
            style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, flex: 1 }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: colors.accent.primary }]} />
          )}
        </View>
        <Text
          style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: 2 }}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={{ fontSize: fontSize.micro ?? 11, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[1] }}>
          {relativeTime(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function NotificationsSheet({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [headerStyle, listStyle] = useScreenAnimation(2);

  const { data: notifications, isLoading } = useNotifications();
  const markRead    = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = (notifications ?? []).some(n => n.readAt === null);

  const handleRowPress = useCallback((id: string) => {
    markRead.mutate(id);
  }, [markRead]);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => (
    <NotifRow item={item} onPress={handleRowPress} theme={theme} />
  ), [handleRowPress, theme]);

  const keyExtractor = useCallback((item: AppNotification) => item.id, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          headerStyle,
          {
            paddingTop:        insets.top + spacing[3],
            paddingHorizontal: spacing[5],
            paddingBottom:     spacing[3],
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
              ← Back
            </Text>
          </Pressable>

          {hasUnread && (
            <Pressable onPress={() => markAllRead.mutate()} disabled={markAllRead.isPending} hitSlop={8}>
              <Text style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.medium,
                color:      markAllRead.isPending ? colors.text.muted : colors.accent.primary,
              }}>
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={{
          fontSize:   fontSize.headingLg,
          fontFamily: fontFamily.bold,
          color:      colors.text.primary,
          marginTop:  spacing[3],
        }}>
          Notifications
        </Text>
      </Animated.View>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <Animated.View style={[{ flex: 1 }, listStyle]}>
        {isLoading ? (
          <View>
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                <SkeletonRow theme={theme} />
                {i < 2 && (
                  <View style={[styles.separator, { backgroundColor: colors.border.subtle, marginLeft: spacing[5] + 44 + 12 }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        ) : notifications && notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border.subtle, marginLeft: spacing[5] + 44 + 12 }]} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
          />
        ) : (
          <View style={[styles.empty, { paddingHorizontal: spacing[8] ?? 32 }]}>
            <Text style={{ fontSize: 40, marginBottom: spacing[3] }}>🔔</Text>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
              {"You're all caught up!"}
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[1], textAlign: 'center' }}>
              Budget alerts will appear here when they fire.
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle:{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  separator: { height: StyleSheet.hairlineWidth },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default NotificationsSheet;
