import React from 'react';
import { Text, View } from 'react-native';
import { BracketMatch } from '../domain/bracket';
import { FlagLabel } from './FlagLabel';

interface MatchCardProps {
  match: BracketMatch;
  testID?: string;
}

export function MatchCard({ match, testID }: MatchCardProps) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const scoreText = hasScore ? `${match.homeScore} - ${match.awayScore}` : 'vs';

  return (
    <View
      testID={testID}
      className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <FlagLabel team={match.homeTeam} className="flex-1" />
      <Text className="mx-3 text-sm font-semibold text-neutral-400 dark:text-neutral-500">{scoreText}</Text>
      <FlagLabel team={match.awayTeam} className="flex-1 justify-end" />
    </View>
  );
}
