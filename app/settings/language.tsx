import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

const LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selected, setSelected] = useState('en');

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <View style={{ width: 38 }} />
      </View>
      <GlassCard style={styles.card} noBorder>
        {LANGS.map((l, i) => (
          <TouchableOpacity key={l.code} style={[styles.row, i > 0 && styles.rowBorder]} onPress={() => setSelected(l.code)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>{l.name}</Text>
              <Text style={styles.langNative}>{l.native}</Text>
            </View>
            {selected === l.code && <Feather name="check" size={18} color={Colors.accent} />}
          </TouchableOpacity>
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
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  langName: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  langNative: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
