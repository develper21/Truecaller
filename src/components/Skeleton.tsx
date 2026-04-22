import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/src/theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function CallItemSkeleton() {
  return (
    <View style={callItemStyles.container}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={callItemStyles.info}>
        <Skeleton width={140} height={18} borderRadius={4} />
        <Skeleton width={100} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={60} height={14} borderRadius={4} />
    </View>
  );
}

export function ContactItemSkeleton() {
  return (
    <View style={callItemStyles.container}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={callItemStyles.info}>
        <Skeleton width={120} height={16} borderRadius={4} />
        <Skeleton width={90} height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function MessageItemSkeleton() {
  return (
    <View style={callItemStyles.container}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={callItemStyles.info}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={100} height={16} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function StatsCardSkeleton() {
  return (
    <View style={statsStyles.container}>
      <Skeleton width={40} height={24} borderRadius={4} />
      <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={profileStyles.container}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <Skeleton width={150} height={20} borderRadius={4} style={{ marginTop: 16 }} />
      <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <View style={profileStatsStyles.row}>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

const callItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  info: {
    flex: 1,
  },
});

const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
  },
});

const profileStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
});

const profileStatsStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
});
