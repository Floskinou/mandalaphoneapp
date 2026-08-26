import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet as RNStyleSheet } from 'react-native';
import { colors } from '../theme';

export default function PrimaryButton({ label, onPress, light = false }: { label: string; onPress: () => void; light?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
      {!light && <LinearGradient colors={[colors.green, colors.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={RNStyleSheet.absoluteFill} />}
      {light && <View style={[RNStyleSheet.absoluteFill, styles.lightFill]} />}
      <Text style={[styles.text, light && { color: colors.violet }]}>{label}</Text>
      <Ionicons name="arrow-forward" color={light ? colors.violet : 'white'} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 58, borderRadius: 22, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, overflow: 'hidden' },
  lightFill: { backgroundColor: 'white' },
  text: { color: 'white', fontSize: 16, fontWeight: '800' },
});
