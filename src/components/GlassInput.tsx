import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface GlassInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  style?: ViewStyle;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
}

export function GlassInput({
  placeholder,
  value,
  onChangeText,
  label,
  style,
  keyboardType = 'default',
  secureTextEntry,
  autoFocus,
  maxLength,
  textAlign = 'left',
  fontSize = 15,
}: GlassInputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, { textAlign, fontSize }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
  },
});
