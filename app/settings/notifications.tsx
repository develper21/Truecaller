import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

const NOTIF_SETTINGS = [
  { id: 'incoming', label: 'Incoming Calls', desc: 'Show caller info for incoming calls' },
  { id: 'spam', label: 'Spam Alerts', desc: 'Alert when spam calls are detected' },
  { id: 'messages', label: 'New Messages', desc: 'Notifications for new messages' },
  { id: 'profileViews', label: 'Profile Views', desc: 'When someone views your profile' },
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ incoming: true, spam: true, messages: false, profileViews: true });

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>
      <GlassCard style={styles.card} noBorder>
        {NOTIF_SETTINGS.map((s, i) => (
          <View key={s.id} style={[styles.row, i < NOTIF_SETTINGS.length - 1 && styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
            <Switch
              value={enabled[s.id]}
              onValueChange={(v) => setEnabled((p) => ({ ...p, [s.id]: v }))}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.accent, opacity: 0.06, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  card: { marginHorizontal: 16, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  label: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  desc: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
});
