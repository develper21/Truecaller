import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { TrustBadge, CommunityVotes } from '@/src/components/TrustBadge';
import { getCallLogById, getCallHistory, CallLogResponse } from '@/src/api/callLogs';
import { lookupPhoneNumber, PhoneNumberLookupResponse } from '@/src/api/phoneNumbers';

export default function CallDetailsScreen() {
  const { id, phoneNumber } = useLocalSearchParams<{ id: string; phoneNumber: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [call, setCall] = useState<CallLogResponse | PhoneNumberLookupResponse | null>(null);
  const [history, setHistory] = useState<CallLogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch call details and history
  const fetchCallDetails = useCallback(async () => {
    try {
      setLoading(true);
      let callData: CallLogResponse | PhoneNumberLookupResponse | null = null;
      
      // Try to get call log by ID first
      if (id && id !== 'undefined') {
        try {
          const logId = parseInt(id, 10);
          if (!isNaN(logId)) {
            callData = await getCallLogById(logId);
          }
        } catch (err) {
          console.log('Call log not found, trying phone lookup');
        }
      }
      
      // If no call log, lookup by phone number
      if (!callData && phoneNumber) {
        callData = await lookupPhoneNumber(phoneNumber);
      }
      
      setCall(callData);
      
      // Fetch call history for this number
      if (callData?.number || phoneNumber) {
        const num = callData?.number || phoneNumber || '';
        const historyData = await getCallHistory(num, 10, 0);
        setHistory(historyData);
      }
    } catch (err: any) {
      console.error('Failed to fetch call details:', err);
      Alert.alert('Error', 'Failed to load call details');
    } finally {
      setLoading(false);
    }
  }, [id, phoneNumber]);

  // Load data on mount
  useEffect(() => {
    fetchCallDetails();
  }, [fetchCallDetails]);

  const isSpam = call?.type === 'spam' || call?.isSpam || (call as PhoneNumberLookupResponse)?.trustLevel === 'spam';

  const ACTIONS = [
    { icon: 'phone', label: 'Call', color: Colors.success },
    { icon: 'message-circle', label: 'Message', color: Colors.accent },
    { icon: 'slash', label: 'Block', color: Colors.error },
    { icon: 'alert-triangle', label: 'Report', color: Colors.spam },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caller Info</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <AvatarBadge 
            name={call?.name || call?.number || 'Unknown'} 
            size={80} 
            isSpam={isSpam} 
            isBusiness={call?.isBusiness} 
          />
          <Text style={styles.callerName}>{call?.name || call?.number || 'Unknown'}</Text>
          <Text style={styles.callerNumber}>{call?.number || phoneNumber || ''}</Text>
          {call?.location && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{call.location}</Text>
            </View>
          )}
          {/* Trust Layer Section */}
          <View style={styles.trustSection}>
            <TrustBadge
              trustLevel={call?.trustLevel}
              riskScore={call?.riskScore}
              trustScore={call?.trustScore}
              isVerified={call?.isVerified}
              verificationTier={call?.verificationTier}
              isSpam={isSpam}
              spamReports={call?.spamReports}
              size="large"
              showScore
            />
          </View>

          {call?.communityVotes && (
            <View style={styles.communitySection}>
              <CommunityVotes
                safe={call.communityVotes.safe}
                spam={call.communityVotes.spam}
              />
            </View>
          )}

          {isSpam && (
            <View style={styles.spamWarning}>
              <MaterialIcons name="warning" size={16} color={Colors.spam} />
              <Text style={styles.spamWarningText}>
                Reported as SPAM by {call?.spamReports ?? 0} users
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
                <Feather name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        {call.tags && call.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagRow}>
              {call.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Call History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call History</Text>
          <GlassCard style={{ padding: 0 }} noBorder>
            {(history.length > 0 ? history : call ? [call as CallLogResponse] : []).map((h, i, arr) => (
              <View
                key={h.id?.toString() || i}
                style={[
                  styles.historyItem,
                  i < arr.length - 1 && styles.historyBorder,
                ]}
              >
                <View style={styles.historyIcon}>
                  {h.type === 'incoming' ? (
                    <Feather name="phone-incoming" size={14} color={Colors.incoming} />
                  ) : h.type === 'outgoing' ? (
                    <Feather name="phone-outgoing" size={14} color={Colors.outgoing} />
                  ) : h.type === 'missed' ? (
                    <Feather name="phone-missed" size={14} color={Colors.missed} />
                  ) : (
                    <MaterialIcons name="warning" size={14} color={Colors.spam} />
                  )}
                </View>
                <Text style={styles.historyType}>
                  {h.type?.charAt(0).toUpperCase() + h.type?.slice(1) || 'Unknown'}
                </Text>
                <Text style={styles.historyTime}>
                  {h.callTime ? new Date(h.callTime).toLocaleString() : h.time || 'Unknown'}
                </Text>
                {h.duration && <Text style={styles.historyDuration}>{h.duration}</Text>}
              </View>
            ))}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.gradientEnd, top: -60, right: -60, opacity: 0.7,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  moreBtn: { padding: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  profileSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  callerName: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 16, marginBottom: 6 },
  callerNumber: { color: Colors.textSecondary, fontSize: 16, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  locationText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  spamWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.spamBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
  },
  spamWarningText: { color: Colors.spam, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(146,95,226,0.15)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(146,95,226,0.3)',
  },
  tagText: { color: Colors.accent, fontSize: 13, fontFamily: 'Inter_500Medium' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  historyIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center',
  },
  historyType: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  historyTime: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  historyDuration: { color: Colors.textMuted, fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: 8 },
  trustSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  communitySection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});
