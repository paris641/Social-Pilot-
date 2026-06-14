import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const StatCard = ({ label, value, subtext, progress, isAlert }: any) => (
  <View style={[styles.card, isAlert && { borderColor: colors.missed }]}>
    <Text style={[styles.label, isAlert && { color: colors.missed }]}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    {progress !== undefined && (
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 8,
  },
  label: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' },
  value: { color: colors.textMain, fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtext: { color: colors.textMuted, fontSize: 14 },
  barBg: { backgroundColor: colors.bgDark, height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  barFill: { backgroundColor: colors.accent, height: '100%' },
});
