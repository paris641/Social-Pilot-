import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { StatCard } from '../components/StatCard';

export const ReportScreen = () => {
  const { clients, activeClientId } = useStore();
  const client = clients.find(c => c.id === activeClientId);

  if (!client) return <View style={styles.center}><Text style={styles.text}>Please add a client</Text></View>;

  const exportPDF = async () => {
    const html = `
      <html>
        <body style="font-family:sans-serif; padding:40px;">
          <h1>${client.name} - Monthly Report</h1>
          <p>Generated on ${format(new Date(), 'yyyy-MM-dd')}</p>
          <hr/>
          <h2>Summary</h2>
          <p>Total posts tracked and analytics will appear here.</p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={exportPDF}>
        <Text style={styles.btnText}>Export as PDF</Text>
      </TouchableOpacity>
      
      <View style={styles.row}>
        <StatCard label="Total Posts" value="0" subtext="This month" />
        <StatCard label="Total Ad Spend" value="₹0" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgDark },
  text: { color: colors.textMain },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -8, marginTop: 16 },
  btn: { backgroundColor: colors.accent, padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});
