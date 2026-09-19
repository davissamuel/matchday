import React from 'react';
import { FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLeagueDataContext } from '../context/LeagueDataContext';
import { StandingsStackParamList } from '../navigation/RootNavigator';
import { LeagueStanding } from '../domain/league';
import { ScreenContainer } from '../components/ScreenContainer';
import { TeamLabel } from '../components/TeamLabel';
import { colors } from '../theme/colors';

type Navigation = NativeStackNavigationProp<StandingsStackParamList, 'Standings'>;

export default function StandingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { standings, error } = useLeagueDataContext();

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="standings-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!standings) {
    return (
      <ScreenContainer>
        <ActivityIndicator testID="standings-loading" color={colors.light.accent} className="mt-4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        testID="standings-list"
        data={standings}
        keyExtractor={(item) => item.team}
        renderItem={({ item }: { item: LeagueStanding }) => (
          <TouchableOpacity
            testID={`standings-row-${item.team}`}
            onPress={() => navigation.navigate('TeamDetail', { team: item.team })}
            className="flex-row items-center justify-between border-b border-neutral-100 px-2 py-3 dark:border-neutral-900"
          >
            <Text className="w-6 text-neutral-500 dark:text-neutral-400">{item.position}</Text>
            <TeamLabel team={item.team} className="flex-1" />
            <Text className="w-10 text-right text-neutral-500 dark:text-neutral-400">{item.played}</Text>
            <Text className="w-10 text-right text-neutral-500 dark:text-neutral-400">{item.goalDifference}</Text>
            <Text className="w-10 text-right font-bold text-neutral-900 dark:text-neutral-50">{item.points}</Text>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
