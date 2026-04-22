import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { searchContacts, ContactResponse } from '@/src/api/contacts';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export default function DialpadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [number, setNumber] = useState('');
  const [suggestions, setSuggestions] = useState<ContactResponse[]>([]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Search contacts when number changes
  const searchSuggestions = useCallback(async (query: string) => {
    if (query.length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await searchContacts(query);
      setSuggestions(results.slice(0, 3));
    } catch (err) {
      console.error('Failed to search contacts:', err);
      setSuggestions([]);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSuggestions(number);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [number, searchSuggestions]);

  function press(key: string) {
    setNumber((n) => n + key);
  }

  function backspace() {
    setNumber((n) => n.slice(0, -1));
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.bgBlob} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dial</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Number Display */}
      <View style={styles.numberDisplay}>
        <Text style={styles.numberText} numberOfLines={1}>{number || '_ _ _'}</Text>
        {number.length > 0 && (
          <TouchableOpacity onPress={backspace} style={styles.backspaceBtn}>
            <Feather name="delete" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <FlatList
          horizontal
          data={suggestions}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ maxHeight: 60, marginBottom: 8 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestion} onPress={() => setNumber(item.number)}>
              <Text style={styles.suggestionName}>{item.name}</Text>
              <Text style={styles.suggestionNum}>{item.number}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => press(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{key}</Text>
                <Text style={styles.keySubText}>
                  {key === '2' ? 'ABC' : key === '3' ? 'DEF' : key === '4' ? 'GHI' :
                    key === '5' ? 'JKL' : key === '6' ? 'MNO' : key === '7' ? 'PQRS' :
                    key === '8' ? 'TUV' : key === '9' ? 'WXYZ' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Call Button */}
      <View style={[styles.callRow, { paddingBottom: bottomPad + 20 }]}>
        <TouchableOpacity
          style={[styles.callBtn, number.length === 0 && { opacity: 0.5 }]}
          disabled={number.length === 0}
          onPress={() => router.push('/incoming-call')}
          activeOpacity={0.8}
        >
          <Feather name="phone" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: Colors.accent, opacity: 0.06, top: 100, right: -80,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { padding: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  numberDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 20, position: 'relative',
  },
  numberText: {
    color: Colors.textPrimary, fontSize: 34, fontFamily: 'Inter_400Regular',
    letterSpacing: 4, textAlign: 'center', flex: 1,
  },
  backspaceBtn: { position: 'absolute', right: 32, padding: 8 },
  suggestion: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  suggestionName: { color: Colors.textPrimary, fontSize: 13, fontFamily: 'Inter_500Medium' },
  suggestionNum: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' },
  keypad: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', gap: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 16 },
  key: {
    flex: 1, aspectRatio: 1.4, maxHeight: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_400Regular' },
  keySubText: { color: Colors.textMuted, fontSize: 9, fontFamily: 'Inter_400Regular', letterSpacing: 0.5 },
  callRow: { paddingHorizontal: 32, paddingTop: 12, alignItems: 'center' },
  callBtn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
});
