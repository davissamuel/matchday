import React from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useLeagueDataContext } from '../context/LeagueDataContext';
import { StandingsStackParamList } from '../navigation/RootNavigator';
import { ScreenContainer } from '../components/ScreenContainer';
import { TeamLabel } from '../components/TeamLabel';
import { StatPill } from '../components/StatPill';
import { MatchCard } from '../components/MatchCard';

type TeamDetailRoute = RouteProp<StandingsStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { standings, matches, error } = useLeagueDataContext();
  const standing = standings?.find((s) => s.team === route.params.team);

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="team-detail-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!standings) {
    return (
      <ScreenContainer>
        <Text className="mt-4 text-neutral-500 dark:text-neutral-400">Loading standings…</Text>
      </ScreenContainer>
    );
  }

  const teamMatches = (matches ?? []).filter(
    (m) => m.homeTeam === route.params.team || m.awayTeam === route.params.team
  );

  return (
    <ScreenContainer>
      <View className="mt-4">
        <TeamLabel team={route.params.team} className="mb-1 text-xl font-bold" />
        {standing ? (
          <StatPill testID="team-position" label="Position" value={`#${standing.position}`} />
        ) : (
          <Text className="mt-2 text-neutral-500 dark:text-neutral-400">Team not found in standings</Text>
        )}
      </View>
      <View className="mt-4">
        {teamMatches.map((match) => (
          <MatchCard key={match.id} match={match} testID={`team-match-${match.id}`} />
        ))}
      </View>
    </ScreenContainer>
  );
}
