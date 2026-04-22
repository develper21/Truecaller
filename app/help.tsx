import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

const FAQ = [
  { q: 'How does caller identification work?', a: 'TrueGuard uses a database of 100M+ phone numbers to instantly identify callers.' },
  { q: 'Is my personal data safe?', a: 'Yes. We use end-to-end encryption and never share your data with third parties.' },
  { q: 'How do I block a number?', a: 'Open any call log, tap the number, and select Block from the action buttons.' },
  { q: 'How do I report spam?', a: 'In call details, tap Report Spam to notify the community and help protect others.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <GlassCard style={styles.contactCard}>
        <View style={styles.contactRow}>
          <View style={styles.contactIcon}><Feather name="mail" size={20} color={Colors.accent} /></View>
          <View>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@trueguard.app</Text>
          </View>
        </View>
        <View style={[styles.contactRow, styles.borderTop]}>
          <View style={styles.contactIcon}><Feather name="phone" size={20} color={Colors.accent} /></View>
          <View>
            <Text style={styles.contactLabel}>Phone Support</Text>
            <Text style={styles.contactValue}>1800-123-4567 (9AM–6PM)</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      {FAQ.map((item, i) => (
        <GlassCard key={i} style={styles.faqCard}>
          <Text style={styles.faqQ}>{item.q}</Text>
          <Text style={styles.faqA}>{item.a}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.accent, opacity: 0.06, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  contactCard: { marginHorizontal: 16, marginBottom: 12, padding: 0 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  borderTop: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  contactIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(146,95,226,0.12)', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  contactValue: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium' },
  sectionTitle: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 10 },
  faqCard: { marginHorizontal: 16, marginBottom: 8, padding: 14 },
  faqQ: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  faqA: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
