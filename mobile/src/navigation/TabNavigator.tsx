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
