import React from 'react';
import { Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { StatPill } from '../components/StatPill';
import { MatchCard } from '../components/MatchCard';

type TeamDetailRoute = RouteProp<BracketStackParamList, 'TeamDetail'>;

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { bracket, ratings, error } = useBracketDataContext();
  const rating = ratings?.get(route.params.team);

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="team-detail-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  const teamMatches =
    bracket?.matches.filter(
      (m) => m.homeTeam === route.params.team || m.awayTeam === route.params.team
    ) ?? [];

  return (
    <ScreenContainer>
      <View className="mt-4">
        <FlagLabel team={route.params.team} className="mb-1" />
        {rating ? (
          <StatPill testID="team-rating" label="Rating" value={String(Math.round(rating.rating))} />
        ) : (
          <Text testID="team-rating" className="mt-2 text-neutral-500 dark:text-neutral-400">
            Loading rating…
          </Text>
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
