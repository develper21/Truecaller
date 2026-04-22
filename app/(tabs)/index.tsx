import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { CallItem } from '@/src/components/CallItem';
import { GlassCard } from '@/src/components/GlassCard';
import { CallItemSkeleton, StatsCardSkeleton } from '@/src/components/Skeleton';
import { getRecentCalls, CallLogResponse, CallStats, getCallStats } from '@/src/api/callLogs';

const FILTERS = ['All', 'Missed', 'Incoming', 'Outgoing', 'Spam'] as const;
type Filter = typeof FILTERS[number];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLogResponse[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch call logs from API
  const fetchCallLogs = useCallback(async () => {
    try {
      setError(null);
      const logs = await getRecentCalls(50);
      setCallLogs(logs);
      
      // Fetch stats
      const statsData = await getCallStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch call logs:', err);
      setError(err.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCallLogs();
  }, [fetchCallLogs]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = callLogs.filter((log) => {
    if (filter === 'All') return true;
    if (filter === 'Spam') return log.type === 'spam' || log.isSpam;
    return log.type === filter.toLowerCase();
  });

  // Use stats from API, fallback to calculated
  const spamCount = stats?.spamCalls ?? callLogs.filter((l) => l.type === 'spam' || l.isSpam).length;
  const missedCount = stats?.missedCalls ?? callLogs.filter((l) => l.type === 'missed').length;
  const incomingCount = stats?.incomingCalls ?? callLogs.filter((l) => l.type === 'incoming').length;
  const outgoingCount = stats?.outgoingCalls ?? callLogs.filter((l) => l.type === 'outgoing').length;

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={styles.greeting}>Good Morning</Text>
          <Text style={styles.headerTitle}>Recent Calls</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/spam-management')}>
            <MaterialIcons name="warning" size={20} color={Colors.spam} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/dialpad')}>
            <Feather name="phone" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats - with skeleton loading */}
      <View style={styles.statsRow}>
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <GlassCard style={styles.statCard} intensity="light">
              <Text style={[styles.statNum, { color: Colors.missed }]}>{missedCount}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity="light">
              <Text style={[styles.statNum, { color: Colors.spam }]}>{spamCount}</Text>
              <Text style={styles.statLabel}>Spam</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity="light">
              <Text style={[styles.statNum, { color: Colors.incoming }]}>
                {incomingCount}
              </Text>
              <Text style={styles.statLabel}>Incoming</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity="light">
              <Text style={[styles.statNum, { color: Colors.outgoing }]}>
                {outgoingCount}
              </Text>
              <Text style={styles.statLabel}>Outgoing</Text>
            </GlassCard>
          </>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterScroll}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          keyExtractor={(f) => f}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Call List - with skeleton loading */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <CallItemSkeleton />}
          contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CallItem item={item} />}
          contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="phone-off" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {error ? 'Failed to load calls. Pull to retry.' : 'No calls found'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPad + 72 }]}
        onPress={() => router.push('/dialpad')}
        activeOpacity={0.8}
      >
        <Feather name="phone" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.gradientEnd, top: -60, right: -80, opacity: 0.8,
  },
  bgBlob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.accent, bottom: 150, left: -60, opacity: 0.07,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  greeting: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  headerTitle: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
  filterScroll: { marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_500Medium' },
  filterTextActive: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
});
