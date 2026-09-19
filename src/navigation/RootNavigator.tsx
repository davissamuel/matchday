import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LeagueDataProvider } from '../context/LeagueDataContext';
import StandingsScreen from '../screens/StandingsScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import FixturesScreen from '../screens/FixturesScreen';
import { colors } from '../theme/colors';

export type StandingsStackParamList = {
  Standings: undefined;
  TeamDetail: { team: string };
};

const StandingsStack = createNativeStackNavigator<StandingsStackParamList>();

function StandingsStackNavigator() {
  return (
    <StandingsStack.Navigator
      screenOptions={{
        headerTitleAlign: 'left',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <StandingsStack.Screen name="Standings" component={StandingsScreen} />
      <StandingsStack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={({ route }) => ({ title: route.params.team })}
      />
    </StandingsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? colors.dark : colors.light;

  return (
    <LeagueDataProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerTitleAlign: 'left',
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.textMuted,
          }}
        >
          <Tab.Screen
            name="StandingsTab"
            component={StandingsStackNavigator}
            options={{
              title: 'Standings',
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="FixturesTab"
            component={FixturesScreen}
            options={{
              title: 'Fixtures',
              tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </LeagueDataProvider>
  );
}
