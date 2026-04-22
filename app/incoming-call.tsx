import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { 
  initializeSocket, 
  onIncomingCall, 
  acceptCall, 
  rejectCall, 
  endCall,
  reportSpamFromCall,
  disconnectSocket 
} from '@/src/api/websocket';

const { width, height } = Dimensions.get('window');

interface CallerInfo {
  callId: string;
  callerNumber: string;
  name?: string;
  businessName?: string;
  trustLevel: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore: number;
  isSpam: boolean;
  spamReasons?: string[];
  location?: string;
  avatar?: string;
  category?: string;
}

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'incoming' | 'accepted' | 'ended'>('incoming');
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize WebSocket and listen for call events
  useEffect(() => {
    const setupSocket = async () => {
      try {
        await initializeSocket();
        
        // Check if we have call data from params (deep link/notification)
        if (params.callId && params.callerNumber) {
          setCallerInfo({
            callId: params.callId as string,
            callerNumber: params.callerNumber as string,
            name: params.name as string | undefined,
            trustLevel: (params.trustLevel as any) || 'neutral',
            riskScore: parseInt(params.riskScore as string) || 0,
            isSpam: params.isSpam === 'true',
            location: params.location as string | undefined,
            avatar: params.avatar as string | undefined,
            category: params.category as string | undefined,
            spamReasons: params.spamReasons ? (params.spamReasons as string).split(',') : undefined,
          });
        }
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };
    
    setupSocket();
    
    // Subscribe to incoming call events
    const unsubscribeIncoming = onIncomingCall((data: CallerInfo) => {
      console.log('Incoming call received:', data);
      setCallerInfo(data);
    });

    return () => {
      unsubscribeIncoming();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [params]);

  // Pulse animation
  useEffect(() => {
    function createPulse(anim: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 2.2, duration: 1500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])
      );
    }
    createPulse(pulse1, 0).start();
    createPulse(pulse2, 500).start();
    createPulse(pulse3, 1000).start();
  }, []);

  const handleAcceptCall = () => {
    if (callerInfo?.callId) {
      acceptCall(callerInfo.callId);
      setCallStatus('accepted');
      
      // Start call duration timer
      durationInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const handleRejectCall = () => {
    if (callerInfo?.callId) {
      rejectCall(callerInfo.callId, 'User rejected');
      endCall({ callId: callerInfo.callId, duration: 0 });
    }
    router.back();
  };

  const handleEndCall = () => {
    if (callerInfo?.callId) {
      endCall({ callId: callerInfo.callId, duration: callDuration });
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    router.back();
  };

  const handleReportSpam = () => {
    if (callerInfo?.callId) {
      Alert.alert(
        'Report Spam',
        'Are you sure you want to report this call as spam?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Report', 
            style: 'destructive',
            onPress: () => {
              reportSpamFromCall(callerInfo.callId, 'spam', 'Reported from incoming call screen');
              Alert.alert('Reported', 'This number has been reported as spam');
            }
          }
        ]
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayName = callerInfo?.name || callerInfo?.businessName || callerInfo?.callerNumber || 'Unknown Caller';
  const displayNumber = callerInfo?.callerNumber || '';
  const trustLevel = callerInfo?.trustLevel || 'neutral';
  const isSpam = callerInfo?.isSpam || trustLevel === 'spam';

  return (
    <View style={styles.container}>
      <View style={styles.bgGradient} />

      {/* Pulse rings */}
      {callStatus === 'incoming' && [pulse1, pulse2, pulse3].map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: p }],
              opacity: p.interpolate({ inputRange: [1, 2.2], outputRange: [0.3, 0] }),
            },
          ]}
        />
      ))}

      {/* Top section */}
      <View style={[styles.topSection, { paddingTop: Platform.OS === 'web' ? 80 : 60 }]}>
        <Text style={styles.incomingLabel}>
          {callStatus === 'accepted' ? `Call in progress • ${formatDuration(callDuration)}` : 'Incoming Call'}
        </Text>
        <AvatarBadge name={displayName} avatarUrl={callerInfo?.avatar} size={100} />
        <Text style={styles.callerName}>{displayName}</Text>
        <Text style={styles.callerNumber}>{displayNumber}</Text>
        {callerInfo?.location && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={13} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{callerInfo.location}</Text>
          </View>
        )}
        {callerInfo?.category && (
          <View style={styles.categoryRow}>
            <Feather name="briefcase" size={13} color={Colors.accent} />
            <Text style={styles.categoryText}>{callerInfo.category}</Text>
          </View>
        )}
        {isSpam && (
          <View style={styles.spamBanner}>
            <MaterialIcons name="warning" size={16} color={Colors.spam} />
            <Text style={styles.spamText}>SPAM RISK ({callerInfo?.riskScore}%)</Text>
          </View>
        )}
        {callerInfo?.spamReasons && callerInfo.spamReasons.length > 0 && (
          <View style={styles.spamReasons}>
            {callerInfo.spamReasons.map((reason, index) => (
              <Text key={index} style={styles.spamReasonText}>• {reason}</Text>
            ))}
          </View>
        )}
        <View style={[styles.trustBadge, { backgroundColor: getTrustColor(trustLevel) }]}>
          <Text style={styles.trustText}>{trustLevel.toUpperCase()}</Text>
        </View>
      </View>

      {/* Quick Actions - Only show during incoming */}
      {callStatus === 'incoming' && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push(`/chat?number=${displayNumber}`)}>
            <Feather name="message-circle" size={20} color={Colors.textPrimary} />
            <Text style={styles.quickLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn}>
            <Feather name="clock" size={20} color={Colors.textPrimary} />
            <Text style={styles.quickLabel}>Remind</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={handleReportSpam}>
            <MaterialIcons name="block" size={20} color={Colors.spam} />
            <Text style={[styles.quickLabel, { color: Colors.spam }]}>Block</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Call Buttons */}
      <View style={[styles.callButtons, { paddingBottom: Platform.OS === 'web' ? 50 : 60 }]}>
        {callStatus === 'incoming' ? (
          <>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectCall} activeOpacity={0.8}>
              <Feather name="phone-off" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptCall} activeOpacity={0.8}>
              <Feather name="phone" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} activeOpacity={0.8}>
            <Feather name="phone-off" size={28} color="#FFFFFF" />
            <Text style={styles.endCallText}>End Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getTrustColor(trustLevel: string): string {
  switch (trustLevel) {
    case 'verified': return Colors.success;
    case 'trusted': return Colors.accent;
    case 'neutral': return Colors.textSecondary;
    case 'risky': return '#FFA500';
    case 'spam': return Colors.spam;
    default: return Colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center' },
  bgGradient: {
    position: 'absolute',
    width: width * 1.5, height: width * 1.5, borderRadius: width * 0.75,
    backgroundColor: Colors.accentDark, top: -width * 0.5, opacity: 0.4,
  },
  pulseRing: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: Colors.accent,
    alignSelf: 'center',
    top: height * 0.22,
  },
  topSection: { flex: 1, alignItems: 'center', gap: 8, paddingHorizontal: 30 },
  incomingLabel: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  callerName: { color: Colors.textPrimary, fontSize: 30, fontFamily: 'Inter_700Bold', marginTop: 20 },
  callerNumber: { color: Colors.textSecondary, fontSize: 16, fontFamily: 'Inter_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  categoryText: { color: Colors.accent, fontSize: 13, fontFamily: 'Inter_400Regular' },
  spamBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.spamBg, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8,
  },
  spamText: { color: Colors.spam, fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  spamReasons: { marginTop: 8, paddingHorizontal: 20 },
  spamReasonText: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular', marginVertical: 2 },
  trustBadge: {
    marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  trustText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  quickActions: { flexDirection: 'row', gap: 32, paddingVertical: 20 },
  quickBtn: { alignItems: 'center', gap: 6 },
  quickLabel: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  callButtons: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48, paddingTop: 16,
  },
  rejectBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  endCallBtn: {
    width: 200, height: 72, borderRadius: 36, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12,
    shadowColor: Colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  endCallText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Inter_700Bold' },
});
