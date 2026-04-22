import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { AvatarBadge } from './AvatarBadge';
import { TrustBadge } from './TrustBadge';
import { CallLog } from '../data/mockData';
import { CallLogResponse } from '../api/callLogs';

interface CallItemProps {
  item: CallLog | CallLogResponse;
}

function CallTypeIcon({ type, isSpam }: { type: CallLog['type']; isSpam?: boolean }) {
  if (isSpam) {
    return <MaterialIcons name="warning" size={14} color={Colors.spam} />;
  }
  switch (type) {
    case 'incoming':
      return <Feather name="phone-incoming" size={14} color={Colors.incoming} />;
    case 'outgoing':
      return <Feather name="phone-outgoing" size={14} color={Colors.outgoing} />;
    case 'missed':
      return <Feather name="phone-missed" size={14} color={Colors.missed} />;
    case 'spam':
      return <MaterialIcons name="warning" size={14} color={Colors.spam} />;
  }
}

export function CallItem({ item }: CallItemProps) {
  const router = useRouter();
  const isSpam = item.type === 'spam' || item.isSpam;
  const typeColor = isSpam
    ? Colors.spam
    : item.type === 'missed'
    ? Colors.missed
    : item.type === 'outgoing'
    ? Colors.outgoing
    : Colors.incoming;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/call-details', params: { id: item.id } })}
      style={[styles.container, isSpam && styles.spamContainer]}
    >
      <AvatarBadge name={item.name} size={46} isSpam={isSpam} isBusiness={item.isBusiness} />
      <View style={styles.info}>
        <Text style={[styles.name, isSpam && styles.spamName]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.row}>
          <CallTypeIcon type={item.type} isSpam={isSpam} />
          <Text style={[styles.meta, { color: typeColor }]}>
            {isSpam ? ` ${item.spamReports ?? 0} reports` : ` ${item.location ?? item.number}`}
          </Text>
        </View>
        <View style={styles.trustRow}>
          <TrustBadge
            trustLevel={item.trustLevel}
            riskScore={item.riskScore}
            trustScore={item.trustScore}
            isVerified={item.isVerified}
            verificationTier={item.verificationTier}
            isSpam={isSpam}
            spamReports={item.spamReports}
            size="small"
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{item.time}</Text>
        {item.duration && <Text style={styles.duration}>{item.duration}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  spamContainer: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderColor: 'rgba(255,107,53,0.2)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    marginBottom: 3,
  },
  spamName: {
    color: Colors.spam,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 2,
  },
  spamTag: {
    marginTop: 4,
    backgroundColor: Colors.spamBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  spamTagText: {
    color: Colors.spam,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  right: {
    alignItems: 'flex-end',
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  duration: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  trustRow: {
    marginTop: 6,
  },
});
