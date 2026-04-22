import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { TrustLevel, RiskScore } from '@/src/data/mockData';

interface TrustBadgeProps {
  trustLevel?: TrustLevel;
  riskScore?: RiskScore;
  trustScore?: number; // 0-100
  isVerified?: boolean;
  verificationTier?: 'gold' | 'silver' | 'bronze';
  isSpam?: boolean;
  spamReports?: number;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
  onPress?: () => void;
}

export function TrustBadge({
  trustLevel,
  riskScore,
  trustScore,
  isVerified,
  verificationTier,
  isSpam,
  spamReports,
  size = 'medium',
  showScore = false,
  onPress,
}: TrustBadgeProps) {
  const getBadgeConfig = () => {
    if (isSpam) {
      return {
        icon: 'warning' as const,
        iconLib: 'material' as const,
        color: Colors.spam,
        bgColor: Colors.spamBg,
        label: spamReports ? `${spamReports.toLocaleString()} Reports` : 'SPAM',
      };
    }

    if (isVerified) {
      if (verificationTier === 'gold') {
        return {
          icon: 'verified' as const,
          iconLib: 'material' as const,
          color: '#FFD700',
          bgColor: 'rgba(255, 215, 0, 0.15)',
          label: 'Gold Verified',
        };
      }
      if (verificationTier === 'silver') {
        return {
          icon: 'verified' as const,
          iconLib: 'material' as const,
          color: '#C0C0C0',
          bgColor: 'rgba(192, 192, 192, 0.15)',
          label: 'Silver Verified',
        };
      }
      return {
        icon: 'verified' as const,
        iconLib: 'material' as const,
        color: '#CD7F32',
        bgColor: 'rgba(205, 127, 50, 0.15)',
        label: 'Verified',
      };
    }

    switch (trustLevel) {
      case 'verified':
        return {
          icon: 'check-circle' as const,
          iconLib: 'feather' as const,
          color: Colors.success,
          bgColor: 'rgba(76, 175, 80, 0.15)',
          label: 'Verified',
        };
      case 'trusted':
        return {
          icon: 'shield' as const,
          iconLib: 'feather' as const,
          color: Colors.success,
          bgColor: 'rgba(76, 175, 80, 0.15)',
          label: 'Trusted',
        };
      case 'risky':
        return {
          icon: 'alert-triangle' as const,
          iconLib: 'feather' as const,
          color: Colors.spam,
          bgColor: Colors.spamBg,
          label: 'Risky',
        };
      case 'neutral':
        return {
          icon: 'help-circle' as const,
          iconLib: 'feather' as const,
          color: Colors.textSecondary,
          bgColor: 'rgba(255, 255, 255, 0.1)',
          label: 'Unknown',
        };
      default:
        return {
          icon: 'help-circle' as const,
          iconLib: 'feather' as const,
          color: Colors.textSecondary,
          bgColor: 'rgba(255, 255, 255, 0.1)',
          label: 'Unknown',
        };
    }
  };

  const getRiskColor = () => {
    switch (riskScore) {
      case 'critical':
        return Colors.spam;
      case 'high':
        return '#FF6B35';
      case 'medium':
        return '#FFC107';
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const config = getBadgeConfig();
  const riskColor = getRiskColor();

  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, iconSize: 12 },
    medium: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, iconSize: 14 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, iconSize: 16 },
  };

  const s = sizeStyles[size];

  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.bgColor,
            paddingHorizontal: s.paddingHorizontal,
            paddingVertical: s.paddingVertical,
          },
        ]}
      >
        {config.iconLib === 'material' ? (
          <MaterialIcons
            name={config.icon as any}
            size={s.iconSize}
            color={config.color}
            style={styles.icon}
          />
        ) : (
          <Feather
            name={config.icon as any}
            size={s.iconSize}
            color={config.color}
            style={styles.icon}
          />
        )}
        <Text style={[styles.label, { color: config.color, fontSize: s.fontSize }]}>
          {config.label}
        </Text>
      </View>

      {showScore && trustScore !== undefined && (
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: riskColor + '20' },
          ]}
        >
          <Text style={[styles.scoreText, { color: riskColor, fontSize: s.fontSize }]}>
            {trustScore}/100
          </Text>
        </View>
      )}

      {riskScore && (
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: riskColor + '15' },
          ]}
        >
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskText, { color: riskColor, fontSize: s.fontSize }]}>
            {riskScore.charAt(0).toUpperCase() + riskScore.slice(1)} Risk
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface CommunityVotesProps {
  safe: number;
  spam: number;
  size?: 'small' | 'medium';
}

export function CommunityVotes({ safe, spam, size = 'medium' }: CommunityVotesProps) {
  const total = safe + spam;
  const safePercent = total > 0 ? (safe / total) * 100 : 50;
  const spamPercent = total > 0 ? (spam / total) * 100 : 50;

  const isSize = size === 'small';

  return (
    <View style={votesStyles.container}>
      <Text style={[votesStyles.label, { fontSize: isSize ? 10 : 11 }]}>
        Community Feedback
      </Text>
      <View style={votesStyles.barContainer}>
        <View
          style={[
            votesStyles.bar,
            votesStyles.safeBar,
            { width: `${safePercent}%` },
          ]}
        />
        <View
          style={[
            votesStyles.bar,
            votesStyles.spamBar,
            { width: `${spamPercent}%` },
          ]}
        />
      </View>
      <View style={votesStyles.legend}>
        <View style={votesStyles.legendItem}>
          <View style={[votesStyles.dot, votesStyles.safeDot]} />
          <Text style={[votesStyles.legendText, { fontSize: isSize ? 9 : 10 }]}>
            {safe.toLocaleString()} Safe
          </Text>
        </View>
        <View style={votesStyles.legendItem}>
          <View style={[votesStyles.dot, votesStyles.spamDot]} />
          <Text style={[votesStyles.legendText, { fontSize: isSize ? 9 : 10 }]}>
            {spam.toLocaleString()} Spam
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  scoreText: {
    fontFamily: 'Inter_700Bold',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontFamily: 'Inter_600SemiBold',
  },
});

const votesStyles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bar: {
    height: '100%',
  },
  safeBar: {
    backgroundColor: Colors.success,
  },
  spamBar: {
    backgroundColor: Colors.spam,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safeDot: {
    backgroundColor: Colors.success,
  },
  spamDot: {
    backgroundColor: Colors.spam,
  },
  legendText: {
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
});
