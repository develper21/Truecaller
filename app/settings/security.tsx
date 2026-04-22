import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [biometric, setBiometric] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name="arrow-left" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 38 }} />
      </View>
      <GlassCard style={styles.card} noBorder>
        {[
          { label: 'Biometric Lock', desc: 'Use fingerprint or face to unlock', value: biometric, set: setBiometric },
          { label: 'Two-Factor Auth', desc: 'Extra security for your account', value: twoFactor, set: setTwoFactor },
        ].map((s, i) => (
          <View key={s.label} style={[styles.row, i > 0 && styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
            <Switch
              value={s.value}
              onValueChange={s.set}
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
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  label: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 3 },
  desc: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
});
