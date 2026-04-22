import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/theme/colors';
import { GlassInput } from '@/src/components/GlassInput';
import { GlassCard } from '@/src/components/GlassCard';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { lookupPhoneNumber, PhoneNumberLookupResponse, getTrendingSearches } from '@/src/api/phoneNumbers';
import { searchContacts, ContactResponse } from '@/src/api/contacts';

const RECENT_SEARCHES_KEY = '@recent_searches';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(ContactResponse | PhoneNumberLookupResponse)[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Load trending and recent searches on mount
  useEffect(() => {
    loadTrending();
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      setLoadingRecent(true);
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 10)); // Keep only last 10
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const saveRecentSearch = async (search: string) => {
    try {
      const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const loadTrending = async () => {
    try {
      const trendingData = await getTrendingSearches();
      setTrending(trendingData);
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
  };

  // Search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Save to recent searches
      await saveRecentSearch(searchQuery);
      
      // If it's a phone number (digits only), lookup the number
      if (/^[\d\s\-+]+$/.test(searchQuery)) {
        const cleanNumber = searchQuery.replace(/\s/g, '');
        const phoneData = await lookupPhoneNumber(cleanNumber);
        setResults([phoneData]);
      } else {
        // Search contacts by name
        const contactResults = await searchContacts(searchQuery);
        setResults(contactResults);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      // Show empty results on error
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={styles.title}>Search</Text>
        <GlassInput
          placeholder="Search name or number..."
          value={query}
          onChangeText={setQuery}
          keyboardType="default"
          style={{ marginTop: 12 }}
        />
      </View>

      <FlatList
        data={results.length > 0 ? results : []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          query.length < 2 ? (
            <View>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <GlassCard style={styles.listCard} noBorder>
                    {recentSearches.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.recentItem, i < recentSearches.length - 1 && styles.itemBorder]}
                        onPress={() => setQuery(s)}
                      >
                        <Feather name="clock" size={15} color={Colors.textSecondary} />
                        <Text style={styles.recentText}>{s}</Text>
                        <Feather name="arrow-up-left" size={15} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </GlassCard>
                </>
              )}

              {/* Trending */}
              <Text style={styles.sectionTitle}>Trending Numbers</Text>
              {trending.length > 0 ? trending.map((number, index) => (
                <TouchableOpacity key={index} onPress={() => setQuery(number)}>
                  <GlassCard style={styles.trendCard}>
                    <View style={styles.trendRow}>
                      <View style={[styles.trendIcon, { backgroundColor: 'rgba(146,95,226,0.15)' }]}>
                        <Feather name="trending-up" size={18} color={Colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trendNumber}>{number}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              )) : (
                <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 10 }}>
                  No trending numbers
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={32} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No results for "{query}"</Text>
              <Text style={styles.emptySubText}>Try searching a different name or number</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          // Handle both ContactResponse and PhoneNumberLookupResponse
          const isContact = 'userId' in item;
          const name = isContact ? (item as ContactResponse).name : `+${(item as PhoneNumberLookupResponse).number}`;
          const number = isContact ? (item as ContactResponse).number : (item as PhoneNumberLookupResponse).number;
          const isSpam = 'isSpam' in item && item.isSpam === true || (item as PhoneNumberLookupResponse).trustLevel === 'spam';
          const isBusiness = 'isBusiness' in item ? item.isBusiness : false;
          const location = 'location' in item ? item.location : undefined;
          const id = isContact ? (item as ContactResponse).id.toString() : (item as PhoneNumberLookupResponse).number;
          
          return (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => router.push({ pathname: '/call-details', params: { id, phoneNumber: number } })}
            >
              <AvatarBadge name={name} size={44} isSpam={isSpam} isBusiness={isBusiness} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.resultName}>{name}</Text>
                <Text style={styles.resultNumber}>{number}</Text>
                {location && <Text style={styles.resultLocation}>{location}</Text>}
              </View>
              {isSpam && (
                <View style={styles.spamBadge}>
                  <Text style={styles.spamBadgeText}>SPAM</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 4,
  },
  clearText: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  bgBlob: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.gradientEnd, top: -80, right: -60, opacity: 0.7,
  },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  sectionTitle: {
    color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_600SemiBold',
    marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  listCard: { padding: 0, overflow: 'hidden' },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  recentText: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  trendCard: { marginBottom: 8, padding: 12 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trendIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trendName: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_500Medium' },
  trendNumber: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  reportBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  reportText: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular' },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultName: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  resultNumber: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  resultLocation: { color: Colors.textMuted, fontSize: 11, fontFamily: 'Inter_400Regular' },
  spamBadge: { backgroundColor: Colors.spamBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  spamBadgeText: { color: Colors.spam, fontSize: 10, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, fontFamily: 'Inter_400Regular' },
});
