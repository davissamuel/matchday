import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BracketDataProvider } from '../context/BracketDataContext';
import BracketScreen from '../screens/BracketScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';

export type BracketStackParamList = {
  Bracket: undefined;
  TeamDetail: { team: string };
};

const BracketStack = createNativeStackNavigator<BracketStackParamList>();

function BracketStackNavigator() {
  return (
    <BracketStack.Navigator>
      <BracketStack.Screen name="Bracket" component={BracketScreen} />
      <BracketStack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({ title: route.params.team })}
      />
    </BracketStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <BracketDataProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="BracketTab" component={BracketStackNavigator} options={{ title: 'Bracket' }} />
          <Tab.Screen name="SimulateTab" component={SimulationScreen} options={{ title: 'Simulate' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </BracketDataProvider>
  );
}
