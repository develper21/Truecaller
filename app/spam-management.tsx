import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { getMySpamReports, SpamReport, SpamStats, getSpamStats } from '@/src/api/spamReports';
import { getBlockedNumbers } from '@/src/api/phoneNumbers';

type Tab = 'spam' | 'blocked';

export default function SpamManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('spam');
  const [spamProtection, setSpamProtection] = useState(true);
  const [autoBlock, setAutoBlock] = useState(false);
  const [spamReports, setSpamReports] = useState<SpamReport[]>([]);
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>([]);
  const [stats, setStats] = useState<SpamStats | null>(null);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch spam data from API
  const fetchSpamData = useCallback(async () => {
    try {
      setLoading(true);
      const [reports, blocked, spamStats] = await Promise.all([
        getMySpamReports(),
        getBlockedNumbers(),
        getSpamStats(),
      ]);
      setSpamReports(reports);
      setBlockedNumbers(blocked);
      setStats(spamStats);
    } catch (err: any) {
      console.error('Failed to fetch spam data:', err);
      Alert.alert('Error', 'Failed to load spam data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchSpamData();
  }, [fetchSpamData]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Spam & Block</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Toggles */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <GlassCard style={{ padding: 0 }} noBorder>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
                <MaterialIcons name="security" size={16} color={Colors.spam} />
              </View>
              <View>
                <Text style={styles.toggleTitle}>Spam Protection</Text>
                <Text style={styles.toggleDesc}>Block known spam callers</Text>
              </View>
            </View>
            <Switch
              value={spamProtection}
              onValueChange={setSpamProtection}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.toggleRow, styles.toggleBorder]}>
            <View style={styles.toggleLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,82,82,0.15)' }]}>
                <MaterialIcons name="block" size={16} color={Colors.error} />
              </View>
              <View>
                <Text style={styles.toggleTitle}>Auto-Block</Text>
                <Text style={styles.toggleDesc}>Block calls with 1000+ reports</Text>
              </View>
            </View>
            <Switch
              value={autoBlock}
              onValueChange={setAutoBlock}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['spam', 'blocked'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'spam' ? 'Spam List' : 'Blocked Numbers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'spam' ? (
        <FlatList
          data={spamReports}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 20, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Feather name="shield" size={36} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No spam reports yet</Text>
                <Text style={styles.emptySubText}>Reported spam numbers will appear here</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.spamItem}>
              <View style={styles.spamRow}>
                <View style={[styles.iconBox, { backgroundColor: Colors.spamBg, width: 42, height: 42, borderRadius: 12 }]}>
                  <MaterialIcons name="warning" size={20} color={Colors.spam} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spamName}>{item.number}</Text>
                  <Text style={styles.spamNumber}>{item.category}</Text>
                  <Text style={styles.spamMeta}>{item.description || 'No description'}</Text>
                </View>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{item.category}</Text>
                </View>
              </View>
            </GlassCard>
          )}
        />
      ) : (
        <FlatList
          data={blockedNumbers}
          keyExtractor={(i, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 20, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Feather name="check-circle" size={36} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No blocked numbers</Text>
                <Text style={styles.emptySubText}>Blocked numbers will appear here</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.spamItem}>
              <View style={styles.spamRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,82,82,0.12)', width: 42, height: 42, borderRadius: 12 }]}>
                  <MaterialIcons name="block" size={20} color={Colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spamName}>{item}</Text>
                  <Text style={styles.spamMeta}>Blocked number</Text>
                </View>
                <TouchableOpacity style={styles.unblockBtn}>
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: Colors.spam, opacity: 0.06, top: -60, right: -60,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  toggleBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  toggleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggleDesc: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_500Medium' },
  tabTextActive: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  spamItem: { padding: 12 },
  spamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spamName: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium' },
  spamNumber: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  spamMeta: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  catBadge: { backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  catText: { color: Colors.spam, fontSize: 11, fontFamily: 'Inter_500Medium' },
  unblockBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(146,95,226,0.15)', borderWidth: 1, borderColor: 'rgba(146,95,226,0.3)' },
  unblockText: { color: Colors.accent, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
