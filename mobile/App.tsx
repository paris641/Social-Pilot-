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
