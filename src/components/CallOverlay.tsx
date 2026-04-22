import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { TrustLevel, RiskScore } from '@/src/data/mockData';

const { width } = Dimensions.get('window');

interface CallOverlayProps {
  callerName: string;
  callerNumber: string;
  location?: string;
  isSpam?: boolean;
  spamReports?: number;
  trustLevel?: TrustLevel;
  riskScore?: RiskScore;
  trustScore?: number;
  isVerified?: boolean;
  verificationTier?: 'gold' | 'silver' | 'bronze';
  onAccept: () => void;
  onReject: () => void;
  onBlock: () => void;
  onMessage: () => void;
  visible: boolean;
}

export function CallOverlay({
  callerName,
  callerNumber,
  location,
  isSpam,
  spamReports,
  trustLevel,
  riskScore,
  trustScore,
  isVerified,
  verificationTier,
  onAccept,
  onReject,
  onBlock,
  onMessage,
  visible,
}: CallOverlayProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getTrustBadge = () => {
    if (isSpam) {
      return { icon: 'warning' as const, color: Colors.spam, text: 'SPAM RISK' };
    }
    if (isVerified && verificationTier === 'gold') {
      return { icon: 'verified' as const, color: '#FFD700', text: 'GOLD VERIFIED' };
    }
    if (isVerified && verificationTier === 'silver') {
      return { icon: 'verified' as const, color: '#C0C0C0', text: 'SILVER VERIFIED' };
    }
    if (trustLevel === 'trusted') {
      return { icon: 'shield' as const, color: Colors.success, text: 'TRUSTED' };
    }
    if (trustLevel === 'risky') {
      return { icon: 'alert-triangle' as const, color: Colors.spam, text: 'RISKY' };
    }
    return null;
  };

  const getRiskColor = () => {
    switch (riskScore) {
      case 'critical': return Colors.spam;
      case 'high': return '#FF6B35';
      case 'medium': return '#FFC107';
      case 'low': return Colors.success;
      default: return Colors.textSecondary;
    }
  };

  const trustBadge = getTrustBadge();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={[styles.card, isSpam && styles.spamCard]}>
        {/* Trust Badge Header */}
        {trustBadge && (
          <View style={[styles.trustHeader, { backgroundColor: trustBadge.color + '20' }]}>
            <MaterialIcons name={trustBadge.icon} size={14} color={trustBadge.color} />
            <Text style={[styles.trustText, { color: trustBadge.color }]}>
              {trustBadge.text}
            </Text>
            {trustScore !== undefined && (
              <View style={[styles.scoreBadge, { backgroundColor: getRiskColor() + '30' }]}>
                <Text style={[styles.scoreText, { color: getRiskColor() }]}>
                  {trustScore}/100
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Caller Info */}
        <View style={styles.callerInfo}>
          <Text style={styles.callerName} numberOfLines={1}>
            {callerName}
          </Text>
          <Text style={styles.callerNumber}>{callerNumber}</Text>
          {location && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}
          {isSpam && spamReports && (
            <View style={styles.spamWarning}>
              <MaterialIcons name="warning" size={14} color={Colors.spam} />
              <Text style={styles.spamText}>
                {spamReports.toLocaleString()} spam reports
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
            <Feather name="phone-off" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, styles.messageBtn]} onPress={onMessage}>
            <Feather name="message-circle" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={onBlock}>
            <MaterialIcons name="block" size={20} color={Colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
            <Feather name="phone" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Compact Actions Label */}
        <Text style={styles.swipeHint}>Swipe up to dismiss • Tap to open app</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  spamCard: {
    borderColor: Colors.spam + '50',
    backgroundColor: 'rgba(46, 26, 26, 0.98)',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  trustText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  scoreText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  callerInfo: {
    marginBottom: 16,
  },
  callerName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  callerNumber: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  spamWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  spamText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.spam,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  messageBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blockBtn: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  swipeHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
