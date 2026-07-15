import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BracketDataProvider } from '../context/BracketDataContext';
import BracketScreen from '../screens/BracketScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import SimulationScreen from '../screens/SimulationScreen';
import { colors } from '../theme/colors';

export type BracketStackParamList = {
  Bracket: undefined;
  TeamDetail: { team: string };
};

const BracketStack = createNativeStackNavigator<BracketStackParamList>();

function BracketStackNavigator() {
  return (
    <BracketStack.Navigator screenOptions={{ headerTitleAlign: 'left', headerBackButtonDisplayMode: 'minimal' }}>
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
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: colors.light.accent,
            tabBarInactiveTintColor: colors.light.textMuted,
          }}
        >
          <Tab.Screen
            name="BracketTab"
            component={BracketStackNavigator}
            options={{
              title: 'Bracket',
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Ionicons name="git-network-outline" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="SimulateTab"
            component={SimulationScreen}
            options={{
              title: 'Simulate',
              tabBarIcon: ({ color, size }) => <Ionicons name="flask-outline" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </BracketDataProvider>
  );
}
