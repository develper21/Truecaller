import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { GlassButton } from '@/src/components/GlassButton';
import { GlassInput } from '@/src/components/GlassInput';
import { sendOtp } from '@/src/api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [countryCode] = useState('+91');
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bgBlob1} />
        <View style={styles.bgBlob2} />

        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>📞</Text>
          </View>
          <Text style={styles.appName}>TrueGuard</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.heading}>Sign In</Text>
          <Text style={styles.sub}>Enter your mobile number to continue</Text>

          <View style={styles.phoneRow}>
            <View style={styles.countryBox}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.countryCode}>{countryCode}</Text>
            </View>
            <GlassInput
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.phoneInput}
            />
          </View>

          <GlassButton
            title={loading ? 'Sending...' : 'Send OTP'}
            onPress={async () => {
              if (phone.length < 10) return;
              setLoading(true);
              try {
                const fullPhone = countryCode + phone;
                await sendOtp(fullPhone);
                router.push({ pathname: '/otp', params: { phone: fullPhone } });
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            fullWidth
            style={{ marginTop: 20 }}
            disabled={phone.length < 10 || loading}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            {['google', 'facebook'].map((s) => (
              <TouchableOpacity key={s} style={styles.socialBtn} activeOpacity={0.7}>
                <Feather name={s === 'google' ? 'mail' : 'facebook'} size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <Text style={styles.terms}>
          By signing in, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  content: { padding: 24, paddingBottom: 40 },
  bgBlob1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: Colors.gradientEnd, top: -100, left: -100, opacity: 0.7,
  },
  bgBlob2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: Colors.accent, bottom: 50, right: -80, opacity: 0.12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 36, gap: 12 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 26 },
  appName: { color: Colors.textPrimary, fontSize: 28, fontFamily: 'Inter_700Bold' },
  card: { padding: 24 },
  heading: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  sub: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 24 },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  countryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  flagText: { fontSize: 18 },
  countryCode: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  phoneInput: { flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  terms: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
  link: { color: Colors.accent, fontFamily: 'Inter_500Medium' },
});
