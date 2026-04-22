import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { GlassButton } from '@/src/components/GlassButton';

const permissions = [
  {
    id: 'contacts',
    icon: 'users',
    iconLib: 'feather',
    title: 'Contacts',
    desc: 'Identify callers from your contacts list',
    required: true,
  },
  {
    id: 'phone',
    icon: 'phone',
    iconLib: 'feather',
    title: 'Phone',
    desc: 'Display caller info during calls',
    required: true,
  },
  {
    id: 'notifications',
    icon: 'bell',
    iconLib: 'feather',
    title: 'Notifications',
    desc: 'Get alerts for spam calls and messages',
    required: false,
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    contacts: true,
    phone: true,
    notifications: false,
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />
      <View style={styles.content}>
        <View style={styles.headerArea}>
          <View style={styles.headerIcon}>
            <Feather name="shield" size={36} color={Colors.accent} />
          </View>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            TrueGuard needs a few permissions to protect you from spam and identify callers.
          </Text>
        </View>

        <View style={styles.list}>
          {permissions.map((p) => (
            <GlassCard key={p.id} style={styles.permCard}>
              <View style={styles.permRow}>
                <View style={[styles.permIcon, { backgroundColor: Colors.accent + '20' }]}>
                  {p.iconLib === 'feather' ? (
                    <Feather name={p.icon as any} size={22} color={Colors.accent} />
                  ) : (
                    <MaterialIcons name={p.icon as any} size={22} color={Colors.accent} />
                  )}
                </View>
                <View style={styles.permInfo}>
                  <View style={styles.permTitleRow}>
                    <Text style={styles.permTitle}>{p.title}</Text>
                    {p.required && (
                      <View style={styles.reqBadge}>
                        <Text style={styles.reqText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.permDesc}>{p.desc}</Text>
                </View>
                <Switch
                  value={enabled[p.id]}
                  onValueChange={(v) => setEnabled((prev) => ({ ...prev, [p.id]: v }))}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </GlassCard>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <GlassButton title="Allow Permissions & Continue" onPress={() => router.replace('/login')} fullWidth />
        <Text style={styles.note}>You can change these in Settings at any time</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accent,
    opacity: 0.1,
    top: -80,
    right: -80,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  headerArea: { alignItems: 'center', paddingVertical: 32 },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(146,95,226,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(146,95,226,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  list: { gap: 12 },
  permCard: { padding: 14 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  permIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permInfo: { flex: 1 },
  permTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  permTitle: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  reqBadge: {
    backgroundColor: Colors.accent + '30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  reqText: { color: Colors.accent, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  permDesc: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  note: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 12,
  },
});
