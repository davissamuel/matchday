import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { BracketMatch } from '../domain/bracket';

type TeamDetailRoute = RouteProp<BracketStackParamList, 'TeamDetail'>;

function formatMatchLine(match: BracketMatch): string {
  const scoreText =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore} - ${match.awayScore}`
      : 'vs';
  return `${match.homeTeam} ${scoreText} ${match.awayTeam}`;
}

export default function TeamDetailScreen() {
  const route = useRoute<TeamDetailRoute>();
  const { bracket, ratings, error } = useBracketDataContext();
  const rating = ratings?.get(route.params.team);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text testID="team-detail-error">{error}</Text>
      </SafeAreaView>
    );
  }

  const teamMatches =
    bracket?.matches.filter(
      (m) => m.homeTeam === route.params.team || m.awayTeam === route.params.team
    ) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{route.params.team}</Text>
      <Text testID="team-rating">
        {rating ? `Rating: ${Math.round(rating.rating)}` : 'Loading rating…'}
      </Text>
      {teamMatches.map((match) => (
        <Text key={match.id} testID={`team-match-${match.id}`}>
          {formatMatchLine(match)}
        </Text>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
