import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassButton } from '@/src/components/GlassButton';
import { verifyOtp, sendOtp } from '@/src/api/auth';

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const phoneDisplay = phone ? phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 $2 $3') : '+91 98765 43XXX';

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleChange(text: string, index: number) {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Feather name="message-circle" size={36} color={Colors.accent} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.sub}>We sent a 6-digit code to{'\n'}{phoneDisplay}</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
              value={digit}
              onChangeText={(t) => handleChange(t.slice(-1), i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
          ))}
        </View>

        <GlassButton
          title={loading ? 'Verifying...' : 'Verify & Sign In'}
          onPress={async () => {
            if (!phone || otp.join('').length < 6) return;
            setLoading(true);
            try {
              await verifyOtp(phone, otp.join(''));
              router.replace('/(tabs)');
            } catch (error: any) {
              Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
              // Clear OTP on error
              setOtp(['', '', '', '', '', '']);
              inputs.current[0]?.focus();
            } finally {
              setLoading(false);
            }
          }}
          fullWidth
          style={styles.btn}
          disabled={otp.join('').length < 6 || loading}
        />

        {timer > 0 ? (
          <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={async () => {
            if (!phone) return;
            try {
              await sendOtp(phone);
              setTimer(30);
              Alert.alert('Success', 'OTP has been resent to your phone number.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to resend OTP.');
            }
          }}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.accent, opacity: 0.1, top: -60, right: -80,
  },
  backBtn: { marginLeft: 20, marginTop: 8, padding: 8 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 32, alignItems: 'center' },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(146,95,226,0.15)',
    borderWidth: 1, borderColor: 'rgba(146,95,226,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { color: Colors.textPrimary, fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  sub: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 32, width: '100%', justifyContent: 'center' },
  otpBox: {
    width: 48, height: 56, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    color: Colors.textPrimary, fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.accent, backgroundColor: 'rgba(146,95,226,0.15)' },
  btn: { borderRadius: 16, paddingVertical: 14, marginBottom: 20 },
  timerText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  resendText: { color: Colors.accent, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
