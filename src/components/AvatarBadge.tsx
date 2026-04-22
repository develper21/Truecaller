import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../theme/colors';

interface AvatarBadgeProps {
  name: string;
  size?: number;
  isSpam?: boolean;
  isBusiness?: boolean;
  avatarUrl?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#925FE2', '#6A4F95', '#E91E63', '#9C27B0', '#3F51B5',
    '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#FF9800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AvatarBadge({ name, size = 44, isSpam, isBusiness, avatarUrl }: AvatarBadgeProps) {
  const bgColor = isSpam ? Colors.spam : getAvatarColor(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          overflow: 'hidden',
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
      )}
      {isBusiness && (
        <View style={[styles.badge, { backgroundColor: Colors.accent }]}>
          <Text style={styles.badgeText}>B</Text>
        </View>
      )}
      {isSpam && (
        <View style={[styles.badge, { backgroundColor: Colors.spam }]}>
          <Text style={styles.badgeText}>!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
});
