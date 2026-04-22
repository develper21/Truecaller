import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>About TrueGuard</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.logoSection}>
        <View style={styles.logoBox}><Text style={{ fontSize: 36 }}>📞</Text></View>
        <Text style={styles.appName}>TrueGuard</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <GlassCard style={styles.infoCard}>
        <Text style={styles.infoText}>
          TrueGuard is a premium caller identification app that helps you know who's calling before you answer.
          With a database of 100M+ numbers, we protect you from spam, fraud, and unwanted calls.
        </Text>
      </GlassCard>

      {[
        { label: 'Version', value: '1.0.0' },
        { label: 'Build', value: '2024.1' },
        { label: 'Database Size', value: '100M+ Numbers' },
        { label: 'Countries', value: '190+' },
      ].map((i) => (
        <GlassCard key={i.label} style={styles.statRow}>
          <Text style={styles.statLabel}>{i.label}</Text>
          <Text style={styles.statValue}>{i.value}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.accent, opacity: 0.07, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  logoSection: { alignItems: 'center', paddingVertical: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(146,95,226,0.15)', borderWidth: 1, borderColor: 'rgba(146,95,226,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { color: Colors.textPrimary, fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  version: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  infoCard: { marginHorizontal: 16, marginBottom: 12, padding: 16 },
  infoText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  statRow: { marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  statLabel: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  statValue: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
