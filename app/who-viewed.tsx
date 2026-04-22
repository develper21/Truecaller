import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { getProfileViewers, ProfileViewer } from '@/src/api/profile';

export default function WhoViewedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch profile viewers from API
  const fetchViewers = useCallback(async () => {
    try {
      setLoading(true);
      const viewersData = await getProfileViewers(20, 0);
      setViewers(viewersData);
    } catch (err: any) {
      console.error('Failed to fetch profile viewers:', err);
      Alert.alert('Error', 'Failed to load profile viewers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load viewers on mount
  useEffect(() => {
    fetchViewers();
  }, [fetchViewers]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Who Viewed My Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <GlassCard style={styles.summaryCard}>
        <Text style={styles.viewCount}>{viewers.length}</Text>
        <Text style={styles.viewLabel}>Profile views this week</Text>
        <View style={styles.premiumNote}>
          <Feather name="star" size={13} color="#FFD700" />
          <Text style={styles.premiumText}>Premium feature — upgrade to see all viewers</Text>
        </View>
      </GlassCard>

      <FlatList
        data={viewers}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Feather name="eye-off" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No profile views yet</Text>
              <Text style={styles.emptySubText}>Your profile views will appear here</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <GlassCard style={{ padding: 12 }}>
            <View style={styles.viewerRow}>
              <AvatarBadge name={item.viewerName || 'Unknown'} avatarUrl={item.viewerAvatar} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.viewerName}>{item.viewerName || 'Unknown'}</Text>
                <Text style={styles.viewerMeta}>{new Date(item.viewedAt).toLocaleString()}</Text>
              </View>
              <Feather name="eye" size={16} color={Colors.textSecondary} />
            </View>
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.accent, opacity: 0.07, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  summaryCard: { marginHorizontal: 16, marginBottom: 16, alignItems: 'center', padding: 24 },
  viewCount: { color: Colors.accent, fontSize: 48, fontFamily: 'Inter_700Bold' },
  viewLabel: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  premiumNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  premiumText: { color: '#FFD700', fontSize: 12, fontFamily: 'Inter_400Regular' },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewerName: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  viewerNum: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  viewerMeta: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
