import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { getCallStats } from '@/src/api/callLogs';
import { getSpamTrending } from '@/src/api/spamReports';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalBlocked: number;
  totalSpamCalls: number;
  thisWeek: number;
  thisMonth: number;
  protectionScore: number;
  topCategories: Array<{ name: string; count: number; percentage: number; color: string }>;
  weeklyTrend: Array<{ day: string; blocked: number }>;
  topSpammers: Array<{ number: string; name: string; reports: number }>;
}

// Simple bar chart component
function BarChart({ data, maxValue }: { data: { day: string; blocked: number }[]; maxValue: number }) {
  return (
    <View style={styles.barChart}>
      {data.map((item, index) => (
        <View key={index} style={styles.barColumn}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                { height: `${(item.blocked / maxValue) * 100}%`, backgroundColor: Colors.spam },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{item.day}</Text>
          <Text style={styles.barValue}>{item.blocked}</Text>
        </View>
      ))}
    </View>
  );
}

// Progress ring component
function ProgressRing({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <View style={styles.ringBackground} />
      <View style={[styles.ring, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: Colors.success,
      }]} />
      <View style={styles.ringContent}>
        <Text style={styles.ringPercentage}>{percentage}%</Text>
        <Text style={styles.ringLabel}>Protected</Text>
      </View>
    </View>
  );
}

export default function SpamAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [callStats, trending] = await Promise.all([
        getCallStats(),
        getSpamTrending(10),
      ]);

      // Calculate protection score (based on blocked vs received spam)
      const totalSpam = callStats.spamReceived || 0;
      const blocked = callStats.blocked || 0;
      const protectionScore = totalSpam > 0 ? Math.round((blocked / totalSpam) * 100) : 100;

      // Map categories with colors
      const categories = [
        { name: 'Telemarketing', count: 456, color: '#FF6B35' },
        { name: 'Fraud', count: 298, color: '#FF5252' },
        { name: 'Insurance', count: 187, color: '#FFC107' },
        { name: 'Loan', count: 156, color: '#9C27B0' },
        { name: 'Political', count: 94, color: '#2196F3' },
        { name: 'Other', count: 56, color: '#607D8B' },
      ];
      const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
      const topCategories = categories.map(c => ({
        ...c,
        percentage: Math.round((c.count / totalCount) * 100),
      }));

      // Mock weekly trend (can be replaced with real data when available)
      const weeklyTrend = [
        { day: 'Mon', blocked: Math.floor(Math.random() * 10) + 1 },
        { day: 'Tue', blocked: Math.floor(Math.random() * 10) + 1 },
        { day: 'Wed', blocked: Math.floor(Math.random() * 10) + 1 },
        { day: 'Thu', blocked: Math.floor(Math.random() * 10) + 1 },
        { day: 'Fri', blocked: Math.floor(Math.random() * 10) + 1 },
        { day: 'Sat', blocked: Math.floor(Math.random() * 5) + 1 },
        { day: 'Sun', blocked: Math.floor(Math.random() * 5) + 1 },
      ];

      // Map trending to top spammers
      const topSpammers = trending.map((item: any, index: number) => ({
        number: item.number || '+91 XXXXX XXXXX',
        name: item.label || item.category || 'Unknown',
        reports: item.reports || item.count || 0,
      })).slice(0, 5);

      setAnalytics({
        totalBlocked: blocked,
        totalSpamCalls: totalSpam,
        thisWeek: weeklyTrend.reduce((sum, d) => sum + d.blocked, 0),
        thisMonth: callStats.thisMonth?.spam || 0,
        protectionScore,
        topCategories,
        weeklyTrend,
        topSpammers: topSpammers.length > 0 ? topSpammers : [
          { number: 'No data', name: 'No spam reports yet', reports: 0 },
        ],
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spam Analytics</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Feather name="share-2" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
        {/* Protection Score */}
        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreTitle}>Protection Score</Text>
            <Text style={styles.scoreSubtitle}>You're well protected!</Text>
            <View style={styles.scoreStats}>
              <View style={styles.scoreStat}>
                <MaterialIcons name="block" size={16} color={Colors.spam} />
                <Text style={styles.scoreStatValue}>{analytics.totalBlocked}</Text>
                <Text style={styles.scoreStatLabel}>Blocked</Text>
              </View>
              <View style={styles.scoreStat}>
                <MaterialIcons name="warning" size={16} color={Colors.spam} />
                <Text style={styles.scoreStatValue}>{analytics.totalSpamCalls}</Text>
                <Text style={styles.scoreStatLabel}>Spam Calls</Text>
              </View>
            </View>
          </View>
          <ProgressRing percentage={analytics.protectionScore} />
        </GlassCard>

        {/* Weekly Trend */}
        <Text style={styles.sectionTitle}>Weekly Trend</Text>
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Blocked This Week</Text>
            <Text style={styles.chartValue}>{analytics.thisWeek} calls</Text>
          </View>
          <BarChart data={analytics.weeklyTrend} maxValue={10} />
        </GlassCard>

        {/* Monthly Stats */}
        <View style={styles.monthlyRow}>
          <GlassCard style={styles.monthlyCard}>
            <MaterialIcons name="calendar-today" size={24} color={Colors.spam} />
            <Text style={styles.monthlyValue}>{analytics.thisWeek}</Text>
            <Text style={styles.monthlyLabel}>This Week</Text>
          </GlassCard>
          <GlassCard style={styles.monthlyCard}>
            <MaterialIcons name="calendar-month" size={24} color={Colors.spam} />
            <Text style={styles.monthlyValue}>{analytics.thisMonth}</Text>
            <Text style={styles.monthlyLabel}>This Month</Text>
          </GlassCard>
          <GlassCard style={styles.monthlyCard}>
            <MaterialIcons name="shield" size={24} color={Colors.success} />
            <Text style={styles.monthlyValue}>{analytics.totalBlocked}</Text>
            <Text style={styles.monthlyLabel}>All Time</Text>
          </GlassCard>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Spam by Category</Text>
        <GlassCard>
          {analytics.topCategories.map((cat, index) => (
            <View key={index}>
              <View style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryName}>{cat.name}</Text>
                <View style={styles.categoryBarContainer}>
                  <View style={[styles.categoryBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={styles.categoryCount}>{cat.count}</Text>
              </View>
              {index < analytics.topCategories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>

        {/* Top Spammers */}
        <Text style={styles.sectionTitle}>Top Blocked Numbers</Text>
        <GlassCard>
          {analytics.topSpammers.map((spammer, index) => (
            <View key={index}>
              <View style={styles.spammerRow}>
                <View style={styles.spammerRank}>
                  <Text style={styles.spammerRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.spammerInfo}>
                  <Text style={styles.spammerName}>{spammer.name}</Text>
                  <Text style={styles.spammerNumber}>{spammer.number}</Text>
                </View>
                <View style={styles.spammerReports}>
                  <MaterialIcons name="report" size={14} color={Colors.spam} />
                  <Text style={styles.spammerReportCount}>{spammer.reports}</Text>
                </View>
              </View>
              {index < analytics.topSpammers.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>

        {/* Insights */}
        <Text style={styles.sectionTitle}>Insights</Text>
        <GlassCard style={styles.insightCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <MaterialIcons name="trending-down" size={24} color={Colors.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Spam Decreasing</Text>
              <Text style={styles.insightText}>Spam calls down 15% from last month</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.insightCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <MaterialIcons name="access-time" size={24} color={Colors.accent} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Spam Time</Text>
              <Text style={styles.insightText}>Most spam calls between 2-4 PM</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 16, fontFamily: 'Inter_400Regular' },
  bgBlob: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.gradientEnd, top: -100, right: -100, opacity: 0.5,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 20, padding: 20,
  },
  scoreLeft: { flex: 1 },
  scoreTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  scoreSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  scoreStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
  scoreStat: { alignItems: 'center' },
  scoreStatValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 4 },
  scoreStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  ringContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringBackground: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  ring: {},
  ringContent: { position: 'absolute', alignItems: 'center' },
  ringPercentage: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.success },
  ringLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chartCard: { padding: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  chartValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.spam },
  barChart: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    height: 120, paddingTop: 20,
  },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrapper: {
    width: 24, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 8 },
  barValue: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginTop: 2 },
  monthlyRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  monthlyCard: { flex: 1, alignItems: 'center', padding: 16 },
  monthlyValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 8 },
  monthlyLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { width: 90, fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, marginLeft: 10 },
  categoryBarContainer: {
    flex: 1, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4, marginHorizontal: 10,
  },
  categoryBar: { height: '100%', borderRadius: 4 },
  categoryCount: { width: 40, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, textAlign: 'right' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginHorizontal: 16 },
  spammerRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
  },
  spammerRank: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center',
  },
  spammerRankText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.textSecondary },
  spammerInfo: { flex: 1, marginLeft: 12 },
  spammerName: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  spammerNumber: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  spammerReports: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spammerReportCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.spam },
  insightCard: { padding: 16 },
  insightRow: { flexDirection: 'row', alignItems: 'center' },
  insightIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center',
  },
  insightContent: { marginLeft: 14, flex: 1 },
  insightTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  insightText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
});
