import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { getContacts, ContactResponse } from '@/src/api/contacts';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<ContactResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch favorite contacts from API
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoritesData = await getContacts(true); // isFavorite = true
      setFavorites(favoritesData);
    } catch (err: any) {
      console.error('Failed to fetch favorites:', err);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Favorites</Text>
        <View style={{ width: 38 }} />
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="heart" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubText}>Add contacts to favorites</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <GlassCard style={{ padding: 12 }}>
            <View style={styles.row}>
              <AvatarBadge name={item.name} avatarUrl={item.avatar} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.num}>{item.number}</Text>
                {item.location && <Text style={styles.loc}>{item.location}</Text>}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Feather name="phone" size={16} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Feather name="message-circle" size={16} color={Colors.accent} />
                </TouchableOpacity>
              </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  num: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  loc: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
