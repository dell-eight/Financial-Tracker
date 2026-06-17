import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAuthStore } from '../../store/auth.store';
import { getUserProfile, updateProfile, uploadAvatar, syncDisplayNameToAuth } from '../../services/auth.service';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'EditProfile'>;

const TIMEZONES = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kuala_Lumpur',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Pacific/Auckland',
  'Pacific/Sydney',
  'UTC',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── FieldRow ───────────────────────────────────────────────────────────────────
// Defined OUTSIDE EditProfileScreen so React never sees it as a new component
// type on re-render — which would unmount/remount the TextInput and dismiss the
// keyboard on every keystroke.
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors, spacing, fontSize, fontFamily } = useTheme();
  return (
    <View style={{ marginBottom: spacing[1] }}>
      <Text style={{
        fontSize:        fontSize.bodySm,
        fontFamily:      fontFamily.semiBold,
        color:           colors.text.muted,
        marginBottom:    spacing[1],
        paddingHorizontal: spacing[5],
      }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

// ── PickerModal ────────────────────────────────────────────────────────────────
function PickerModal({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
  theme,
}: {
  visible:  boolean;
  title:    string;
  items:    string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose:  () => void;
  theme:    ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.bg.surface, paddingBottom: 32 }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border.subtle }]} />
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[3], paddingHorizontal: spacing[5] }}>
          {title}
        </Text>
        <FlatList
          data={items}
          keyExtractor={i => i}
          style={{ maxHeight: 360 }}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle, marginHorizontal: spacing[5] }} />
          )}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); onSelect(item); onClose(); }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing[5],
                  paddingVertical:   spacing[4],
                  backgroundColor:   pressed ? colors.bg.surfaceMuted : 'transparent',
                  flexDirection:     'row',
                  alignItems:        'center',
                  justifyContent:    'space-between',
                })}
              >
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: isSelected ? fontFamily.semiBold : fontFamily.regular, color: isSelected ? colors.accent.primary : colors.text.primary }}>
                  {item}
                </Text>
                {isSelected && (
                  <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.bold }}>✓</Text>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

// ── EditProfileScreen ──────────────────────────────────────────────────────────
export function EditProfileScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const authUser  = useAuthStore(s => s.user);
  const setSession = useAuthStore(s => s.setSession);

  const [displayName,     setDisplayName]     = useState('');
  const [timezone,        setTimezone]        = useState('Asia/Manila');
  const [fiscalYearStart, setFiscalYearStart] = useState(1);
  const [avatarUrl,       setAvatarUrl]       = useState<string | undefined>(undefined);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [tzPickerOpen,    setTzPickerOpen]    = useState(false);
  const [fyPickerOpen,    setFyPickerOpen]    = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const email  = authUser?.email ?? '';

  // Initialise from the profiles table (source of truth for profile fields).
  // Prefer the DB avatar_url; fall back to user_metadata for freshly set values.
  useEffect(() => {
    if (!authUser) return;
    getUserProfile(authUser.id).then(({ profile }) => {
      if (profile) {
        setDisplayName(profile.display_name ?? '');
        setTimezone(profile.timezone ?? 'Asia/Manila');
        setFiscalYearStart(profile.fiscal_year_start ?? 1);
        setAvatarUrl(
          profile.avatar_url
            ?? (authUser.user_metadata?.avatar_url as string | undefined)
            ?? undefined,
        );
      }
      setLoading(false);
    });
  }, [authUser]);

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!authUser) return;
    setSaving(true);

    // 1. Upload avatar to Supabase Storage if the user picked a new local image
    let finalAvatarUrl = avatarUrl;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const { url, error: uploadError } = await uploadAvatar(authUser.id, avatarUrl);
      if (uploadError) {
        setSaving(false);
        Alert.alert('Error', `Could not upload photo: ${uploadError}`);
        return;
      }
      finalAvatarUrl = url ?? avatarUrl;
    }

    // 2. Persist to the app's users table
    const { error } = await updateProfile(authUser.id, {
      display_name:      displayName.trim() || undefined,
      timezone,
      fiscal_year_start: fiscalYearStart,
      avatar_url:        finalAvatarUrl,
    });

    if (error) {
      setSaving(false);
      Alert.alert('Error', error);
      return;
    }

    // 3. Sync display_name + avatar_url to Supabase Auth user_metadata so
    //    Dashboard and ProfileScreen update immediately without a re-login.
    const { user: freshAuthUser } = await syncDisplayNameToAuth(
      displayName.trim(),
      finalAvatarUrl,
    );
    if (freshAuthUser) {
      setSession(freshAuthUser);
    }

    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Edit Profile
        </Text>
        <Pressable onPress={handleSave} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.accent.primary} />
            : <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.semiBold }}>Save</Text>
          }
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* Avatar */}
        <Pressable onPress={handlePickAvatar} style={{ alignItems: 'center', marginVertical: spacing[6] }}>
          <View style={[styles.avatar, { backgroundColor: colors.accent.muted, borderColor: colors.accent.primary, overflow: 'hidden' }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={{ fontSize: 32, fontFamily: fontFamily.bold, color: colors.accent.primary }}>
                {displayName ? displayName.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.accent.primary, marginTop: spacing[2] }}>
            {avatarUrl ? 'Change Photo' : 'Add Photo'}
          </Text>
        </Pressable>

        {/* Display Name */}
        <FieldRow label="Display Name">
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.text.muted}
            style={[
              styles.input,
              {
                backgroundColor:   colors.bg.surface,
                color:             colors.text.primary,
                fontFamily:        fontFamily.regular,
                fontSize:          fontSize.bodyMd,
                paddingHorizontal: spacing[5],
                paddingVertical:   spacing[4],
                marginHorizontal:  spacing[4],
                borderRadius:      borderRadius.card,
              },
            ]}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </FieldRow>

        {/* Email (read-only) */}
        <FieldRow label="Email">
          <View
            style={{
              backgroundColor:   colors.bg.surface,
              marginHorizontal:  spacing[4],
              borderRadius:      borderRadius.card,
              paddingHorizontal: spacing[5],
              paddingVertical:   spacing[4],
              opacity: 0.6,
            }}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
              {email}
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, paddingHorizontal: spacing[5], marginTop: spacing[1] }}>
            Email cannot be changed here
          </Text>
        </FieldRow>

        {/* Timezone */}
        <FieldRow label="Timezone">
          <Pressable
            onPress={() => setTzPickerOpen(true)}
            style={({ pressed }) => ({
              backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.surface,
              marginHorizontal:  spacing[4],
              borderRadius:      borderRadius.card,
              paddingHorizontal: spacing[5],
              paddingVertical:   spacing[4],
              flexDirection:     'row',
              alignItems:        'center',
              justifyContent:    'space-between',
            })}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary }}>
              {timezone}
            </Text>
            <Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>
          </Pressable>
        </FieldRow>

        {/* Fiscal Year Start */}
        <FieldRow label="Fiscal Year Start">
          <Pressable
            onPress={() => setFyPickerOpen(true)}
            style={({ pressed }) => ({
              backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.surface,
              marginHorizontal:  spacing[4],
              borderRadius:      borderRadius.card,
              paddingHorizontal: spacing[5],
              paddingVertical:   spacing[4],
              flexDirection:     'row',
              alignItems:        'center',
              justifyContent:    'space-between',
            })}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary }}>
              {MONTHS[fiscalYearStart - 1]}
            </Text>
            <Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>
          </Pressable>
        </FieldRow>

      </ScrollView>

      <PickerModal
        visible={tzPickerOpen}
        title="Select Timezone"
        items={TIMEZONES}
        selected={timezone}
        onSelect={setTimezone}
        onClose={() => setTzPickerOpen(false)}
        theme={theme}
      />

      <PickerModal
        visible={fyPickerOpen}
        title="Fiscal Year Start"
        items={MONTHS}
        selected={MONTHS[fiscalYearStart - 1]}
        onSelect={v => setFiscalYearStart(MONTHS.indexOf(v) + 1)}
        onClose={() => setFyPickerOpen(false)}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 88, height: 88 },
  input:       { borderWidth: 0 },
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
});

export default EditProfileScreen;
