import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { MessageItemSkeleton } from '@/src/components/Skeleton';
import { getThreads, Thread } from '@/src/api/messages';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch threads from API
  const fetchThreads = useCallback(async () => {
    try {
      setError(null);
      const threadsData = await getThreads();
      setThreads(threadsData);
    } catch (err: any) {
      console.error('Failed to fetch threads:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchThreads();
  }, [fetchThreads]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="edit" size={18} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <MessageItemSkeleton />}
          contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-square" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Start a conversation from contacts</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.msgItem}
              activeOpacity={0.7}
              onPress={() =>
                router.push({ pathname: '/chat', params: { id: item.id, phoneNumber: item.participantNumber } })
              }
            >
              <AvatarBadge name={item.participantName} size={50} />
              {item.unreadCount > 0 && (
                <View style={styles.unreadDot}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
              <View style={styles.msgInfo}>
                <View style={styles.msgHeader}>
                  <Text style={[styles.msgName, item.unreadCount > 0 && styles.msgNameBold]}>
                    {item.participantName}
                  </Text>
                  <Text style={styles.msgTime}>
                    {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                <Text
                  style={[styles.msgPreview, item.unreadCount > 0 && styles.msgPreviewBold]}
                  numberOfLines={1}
                >
                  {item.lastMessage || 'No messages yet'}
                </Text>
                <Text style={styles.msgNumber}>{item.participantNumber}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.gradientEnd, top: -70, left: -80, opacity: 0.6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  msgItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  unreadDot: {
    position: 'absolute', left: 46, top: 10,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: Colors.gradientStart,
  },
  unreadCount: { color: '#FFFFFF', fontSize: 9, fontFamily: 'Inter_700Bold' },
  msgInfo: { flex: 1, marginLeft: 14 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  msgName: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  msgNameBold: { fontFamily: 'Inter_600SemiBold' },
  msgTime: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  msgPreview: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  msgPreviewBold: { color: Colors.textPrimary, fontFamily: 'Inter_500Medium' },
  msgNumber: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
