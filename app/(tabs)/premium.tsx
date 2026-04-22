import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { GlassButton } from '@/src/components/GlassButton';

const FEATURES = [
  { icon: 'no-ads', label: 'Ad-Free Experience', desc: 'Browse without any interruptions', iconLib: 'material' },
  { icon: 'eye', label: 'Who Viewed Profile', desc: 'See exactly who looked at your profile', iconLib: 'feather' },
  { icon: 'user-x', label: 'Incognito Mode', desc: 'Search without leaving a trace', iconLib: 'feather' },
  { icon: 'shield-off', label: 'Advanced Spam Blocking', desc: 'Block 3x more spam calls automatically', iconLib: 'feather' },
  { icon: 'zap', label: 'Priority Identification', desc: 'Instant caller ID with no delays', iconLib: 'feather' },
  { icon: 'phone-call', label: 'Call Recording', desc: 'Record important calls securely', iconLib: 'feather' },
];

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹99', period: '/month', savings: null, popular: false },
  { id: 'yearly', label: 'Yearly', price: '₹599', period: '/year', savings: 'Save 50%', popular: true },
  { id: 'lifetime', label: 'Lifetime', price: '₹1499', period: 'one-time', savings: 'Best Value', popular: false },
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgGlow} />

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: topPad + 16 }]}>
        <View style={styles.crownBg}>
          <MaterialIcons name="star" size={40} color="#FFD700" />
        </View>
        <Text style={styles.heroTitle}>TrueGuard Premium</Text>
        <Text style={styles.heroSub}>Unlock the full power of caller ID</Text>
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>What You Get</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((f, i) => (
          <GlassCard key={i} style={styles.featureCard} intensity="light">
            <View style={styles.featureIcon}>
              {f.iconLib === 'feather' ? (
                <Feather name={f.icon as any} size={20} color={Colors.accent} />
              ) : (
                <MaterialIcons name="block" size={20} color={Colors.accent} />
              )}
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Plans */}
      <Text style={styles.sectionTitle}>Choose a Plan</Text>
      <View style={styles.plansRow}>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.popular && styles.planCardPopular,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            <Text style={styles.planLabel}>{plan.label}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
            {plan.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{plan.savings}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <GlassButton
          title="Start Free Trial — 7 Days"
          onPress={() => {}}
          fullWidth
          style={styles.ctaBtn}
        />
        <Text style={styles.ctaNote}>Cancel anytime. No credit card required for trial.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgGlow: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: Colors.accent, opacity: 0.08, top: -100, alignSelf: 'center',
  },
  hero: { alignItems: 'center', paddingBottom: 8, paddingHorizontal: 20 },
  crownBg: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { color: Colors.textPrimary, fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  heroSub: { color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  sectionTitle: {
    color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold',
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  featureCard: { width: '47%', padding: 14 },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(146,95,226,0.15)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  featureLabel: { color: Colors.textPrimary, fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  featureDesc: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  plansRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  planCard: {
    flex: 1, padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', position: 'relative',
  },
  planCardSelected: { borderColor: Colors.accent, backgroundColor: 'rgba(146,95,226,0.12)' },
  planCardPopular: { borderColor: Colors.accent },
  popularBadge: {
    position: 'absolute', top: -10, alignSelf: 'center',
    backgroundColor: Colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  popularText: { color: '#FFFFFF', fontSize: 9, fontFamily: 'Inter_700Bold' },
  planLabel: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 8, marginBottom: 6 },
  planPrice: { color: Colors.textPrimary, fontSize: 22, fontFamily: 'Inter_700Bold' },
  planPeriod: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  savingsBadge: {
    marginTop: 8, backgroundColor: 'rgba(76,175,80,0.2)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  savingsText: { color: Colors.success, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  ctaBtn: { borderRadius: 16, paddingVertical: 16 },
  ctaNote: {
    color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_400Regular',
    textAlign: 'center', marginTop: 12,
  },
});
