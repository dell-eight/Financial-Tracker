import React from 'react';
import { View, Text, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/ui/useTheme';

interface Props {
  visible:  boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: Props) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[6] }]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          {message && (
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary, marginTop: spacing[3], textAlign: 'center' }}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  card:     { alignItems: 'center', minWidth: 140, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 12 },
});
