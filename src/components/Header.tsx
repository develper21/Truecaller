import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  transparent?: boolean;
}

export function Header({ title, subtitle, right, left, transparent }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPad + 8,
          backgroundColor: transparent ? 'transparent' : 'rgba(26,26,46,0.95)',
        },
      ]}
    >
      <View style={styles.inner}>
        {left && <View style={styles.side}>{left}</View>}
        <View style={[styles.center, left || right ? {} : styles.centeredTitle]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right && <View style={[styles.side, styles.rightSide]}>{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  center: {
    flex: 1,
  },
  centeredTitle: {
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  side: {
    minWidth: 40,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
});
