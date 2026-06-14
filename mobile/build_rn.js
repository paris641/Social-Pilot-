const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const dirs = ['store', 'navigation', 'screens', 'components', 'theme'];
dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

const write = (filepath, content) => fs.writeFileSync(path.join(__dirname, filepath), content.trim() + '\n');

write('src/theme/colors.ts', `
export const colors = {
  bgDark: '#0f1117',
  bgCard: '#1a1d27',
  accent: '#6366f1',
  textMain: '#f8fafc',
  textMuted: '#94a3b8',
  borderColor: '#334155',
  fbBlue: '#1877f2',
  posted: '#22c55e',
  missed: '#ef4444',
  planned: '#f59e0b',
  todayBorder: '#fbbf24',
};
`);

write('src/store/useStore.ts', `
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Client {
    id: string;
    name: string;
    igHandle: string;
    fbPage: string;
    fee: number;
    logs: Record<string, Record<string, any>>;
    ads: any[];
    billing: Record<string, string>;
}

interface StoreState {
    clients: Client[];
    activeClientId: string | null;
    addClient: (c: Client) => void;
    deleteClient: (id: string) => void;
    setActiveClient: (id: string) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            clients: [],
            activeClientId: null,
            addClient: (c) => set({ clients: [...get().clients, c], activeClientId: c.id }),
            deleteClient: (id) => {
               const clients = get().clients.filter(x => x.id !== id);
               set({ clients, activeClientId: clients.length > 0 ? clients[0].id : null });
            },
            setActiveClient: (id) => set({ activeClientId: id }),
            updateClient: (id, updates) => set({
               clients: get().clients.map(c => c.id === id ? { ...c, ...updates } : c)
            })
        }),
        { name: 'socioplot-storage', storage: createJSONStorage(() => AsyncStorage) }
    )
);
`);

write('src/components/StatCard.tsx', `
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
        <View style={[styles.barFill, { width: \`\${progress}%\` }]} />
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
`);

write('src/screens/TrackerScreen.tsx', `
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
`);

write('src/screens/ReportScreen.tsx', `
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
    const html = \`
      <html>
        <body style="font-family:sans-serif; padding:40px;">
          <h1>\${client.name} - Monthly Report</h1>
          <p>Generated on \${format(new Date(), 'yyyy-MM-dd')}</p>
          <hr/>
          <h2>Summary</h2>
          <p>Total posts tracked and analytics will appear here.</p>
        </body>
      </html>
    \`;
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
`);

write('src/screens/AdsScreen.tsx', `
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
`);

write('src/screens/BillingScreen.tsx', `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const BillingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Billing Configuration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark, padding: 16, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textMuted }
});
`);

write('src/navigation/TabNavigator.tsx', `
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrackerScreen } from '../screens/TrackerScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { AdsScreen } from '../screens/AdsScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { colors } from '../theme/colors';
import { Calendar, FileText, Megaphone, CreditCard, ChevronDown } from 'lucide-react-native';
import { useStore } from '../store/useStore';

const Tab = createBottomTabNavigator();

const HeaderTitle = () => {
  const { clients, activeClientId, addClient, setActiveClient } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');

  const activeClient = clients.find(c => c.id === activeClientId);

  const handleAdd = () => {
    if(name) {
      addClient({ id: Date.now().toString(), name, igHandle: '', fbPage: '', fee: Number(fee)||0, logs: {}, ads: [], billing: {} });
      setName(''); setFee(''); setModalVisible(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
        <Text style={{color: colors.textMain, fontSize: 18, fontWeight: 'bold'}}>{activeClient ? activeClient.name : 'Select Client'}</Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
         <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20}}>
            <View style={{backgroundColor: colors.bgCard, padding: 24, borderRadius: 16}}>
               <Text style={{color: colors.textMain, fontSize: 20, fontWeight: 'bold', marginBottom: 16}}>Manage Clients</Text>
               
               {clients.map(c => (
                 <TouchableOpacity key={c.id} onPress={() => {setActiveClient(c.id); setModalVisible(false);}} style={{padding: 12, borderBottomWidth: 1, borderColor: colors.borderColor}}>
                    <Text style={{color: colors.textMain}}>{c.name}</Text>
                 </TouchableOpacity>
               ))}

               <Text style={{color: colors.textMuted, marginTop: 24, marginBottom: 8}}>Add New Client</Text>
               <TextInput placeholder="Client Name" placeholderTextColor={colors.textMuted} style={{borderWidth: 1, borderColor: colors.borderColor, padding: 12, borderRadius: 8, color: colors.textMain, marginBottom: 8}} value={name} onChangeText={setName} />
               <TextInput placeholder="Monthly Fee" placeholderTextColor={colors.textMuted} keyboardType="numeric" style={{borderWidth: 1, borderColor: colors.borderColor, padding: 12, borderRadius: 8, color: colors.textMain, marginBottom: 16}} value={fee} onChangeText={setFee} />
               
               <View style={{flexDirection: 'row', gap: 8}}>
                 <TouchableOpacity onPress={() => setModalVisible(false)} style={{flex: 1, padding: 14, backgroundColor: colors.bgDark, borderRadius: 8, alignItems: 'center'}}><Text style={{color: 'white'}}>Close</Text></TouchableOpacity>
                 <TouchableOpacity onPress={handleAdd} style={{flex: 1, padding: 14, backgroundColor: colors.accent, borderRadius: 8, alignItems: 'center'}}><Text style={{color: 'white'}}>Add</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </View>
  );
};

const HeaderRight = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return <Text style={{color: colors.textMuted, marginRight: 16, fontFamily: 'monospace'}}>{time.toLocaleTimeString('en-US', { hour12: false })} IST</Text>;
};

export const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.borderColor, shadowColor: 'transparent' },
      headerTintColor: colors.textMain,
      headerTitle: () => <HeaderTitle />,
      headerRight: () => <HeaderRight />,
      tabBarStyle: { backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.borderColor, paddingBottom: 4, paddingTop: 4 },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
    }}
  >
    <Tab.Screen name="Tracker" component={TrackerScreen} options={{ tabBarIcon: ({color}) => <Calendar color={color} size={24} /> }} />
    <Tab.Screen name="Report" component={ReportScreen} options={{ tabBarIcon: ({color}) => <FileText color={color} size={24} /> }} />
    <Tab.Screen name="Ads Log" component={AdsScreen} options={{ tabBarIcon: ({color}) => <Megaphone color={color} size={24} /> }} />
    <Tab.Screen name="Billing" component={BillingScreen} options={{ tabBarIcon: ({color}) => <CreditCard color={color} size={24} /> }} />
  </Tab.Navigator>
);
`);

write('App.tsx', `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { StatusBar } from 'react-native';
import { colors } from './src/theme/colors';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgCard} />
      <TabNavigator />
    </NavigationContainer>
  );
}
`);
