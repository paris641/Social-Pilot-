import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const AdsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ads Log Configuration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark, padding: 16, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textMuted }
});
