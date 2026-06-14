import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { StatCard } from '../components/StatCard';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';

export const TrackerScreen = () => {
  const { clients, activeClientId, updateClient } = useStore();
  const client = clients.find(c => c.id === activeClientId);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [tempLog, setTempLog] = useState<any>({ ig: {}, fb: {} });

  if (!client) return <View style={styles.center}><Text style={styles.text}>Please add a client</Text></View>;

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    const monthKey = day.dateString.substring(0, 7);
    const existingLog = client.logs[monthKey]?.[day.dateString] || { ig: {}, fb: {} };
    setTempLog(JSON.parse(JSON.stringify(existingLog)));
    setModalVisible(true);
  };

  const saveLog = () => {
    const monthKey = selectedDate.substring(0, 7);
    const newLogs = { ...client.logs };
    if (!newLogs[monthKey]) newLogs[monthKey] = {};
    newLogs[monthKey][selectedDate] = tempLog;
    updateClient(client.id, { logs: newLogs });
    setModalVisible(false);
  };

  const markedDates: any = {};
  Object.keys(client.logs).forEach(monthKey => {
      Object.keys(client.logs[monthKey]).forEach(dateStr => {
          const l = client.logs[monthKey][dateStr];
          let color = colors.borderColor;
          if (l.ig?.status === 'posted' && l.fb?.status === 'posted') color = colors.posted;
          else if (l.ig?.status === 'missed' || l.fb?.status === 'missed') color = colors.missed;
          else if (l.ig?.status === 'planned' || l.fb?.status === 'planned') color = colors.planned;
          else if (l.ig?.status === 'posted') color = colors.accent;
          else if (l.fb?.status === 'posted') color = colors.fbBlue;
          
          markedDates[dateStr] = {
              customStyles: {
                  container: { backgroundColor: color, borderRadius: 8 },
                  text: { color: 'white', fontWeight: 'bold' }
              }
          };
      });
  });
  markedDates[format(new Date(), 'yyyy-MM-dd')] = {
      ...(markedDates[format(new Date(), 'yyyy-MM-dd')] || {}),
      customStyles: {
          container: { borderWidth: 2, borderColor: colors.todayBorder, borderRadius: 8, backgroundColor: markedDates[format(new Date(), 'yyyy-MM-dd')]?.customStyles?.container?.backgroundColor || colors.bgCard }
      }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <StatCard label="Instagram Streak" value="🔥" subtext="Calculated live" />
        <StatCard label="Facebook Streak" value="🔥" subtext="Calculated live" />
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          theme={{
            calendarBackground: colors.bgCard,
            textSectionTitleColor: colors.textMuted,
            dayTextColor: colors.textMain,
            todayTextColor: colors.todayBorder,
            monthTextColor: colors.textMain,
            arrowColor: colors.accent,
          }}
          markingType={'custom'}
          markedDates={markedDates}
          onDayPress={handleDayPress}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log for {selectedDate}</Text>
            
            <Text style={styles.sectionHeader}>Instagram</Text>
            <View style={styles.statusRow}>
              {['posted', 'missed', 'planned'].map(s => (
                <TouchableOpacity key={'ig'+s} onPress={() => setTempLog({...tempLog, ig: {...tempLog.ig, status: s}})}
                  style={[styles.statusBtn, tempLog.ig?.status === s && styles.activeStatusBtn]}>
                  <Text style={{color: 'white', textTransform: 'capitalize'}}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Facebook</Text>
            <View style={styles.statusRow}>
              {['posted', 'missed', 'planned'].map(s => (
                <TouchableOpacity key={'fb'+s} onPress={() => setTempLog({...tempLog, fb: {...tempLog.fb, status: s}})}
                  style={[styles.statusBtn, tempLog.fb?.status === s && styles.activeStatusBtn]}>
                  <Text style={{color: 'white', textTransform: 'capitalize'}}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, {backgroundColor: colors.bgDark}]}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveLog} style={[styles.btn, {backgroundColor: colors.accent}]}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgDark },
  text: { color: colors.textMain },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -8 },
  calendarContainer: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.borderColor, marginTop: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.borderColor },
  modalTitle: { color: colors.textMain, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  sectionHeader: { color: colors.textMuted, marginTop: 16, marginBottom: 8, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.borderColor, alignItems: 'center' },
  activeStatusBtn: { backgroundColor: colors.accent, borderColor: colors.accent },
  btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, marginTop: 24 },
  btnText: { color: 'white', fontWeight: 'bold' }
});
