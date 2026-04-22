import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  noBorder?: boolean;
}

export function GlassCard({ children, style, intensity = 'medium', noBorder }: GlassCardProps) {
  const bgOpacity = intensity === 'light' ? 0.05 : intensity === 'medium' ? 0.1 : 0.15;
  const borderOpacity = intensity === 'light' ? 0.08 : intensity === 'medium' ? 0.15 : 0.2;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `rgba(255,255,255,${bgOpacity})`,
          borderColor: noBorder ? 'transparent' : `rgba(255,255,255,${borderOpacity})`,
          borderWidth: noBorder ? 0 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
