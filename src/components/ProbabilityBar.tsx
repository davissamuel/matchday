import React from 'react';
import { Text, View } from 'react-native';

interface ProbabilityBarProps {
  homeTeam: string;
  awayTeam: string;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  testID?: string;
}

export function ProbabilityBar({
  homeTeam,
  awayTeam,
  winProbability,
  drawProbability,
  lossProbability,
  testID,
}: ProbabilityBarProps) {
  const winPct = Math.round(winProbability * 100);
  const drawPct = Math.round(drawProbability * 100);
  const lossPct = Math.round(lossProbability * 100);

  return (
    <View testID={testID} className="mt-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${winPct}%`}</Text>
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${drawPct}%`}</Text>
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{`${lossPct}%`}</Text>
      </View>
      <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <View className="h-full bg-accent dark:bg-accent-dark" style={{ width: `${winPct}%` }} />
        <View className="h-full bg-neutral-400 dark:bg-neutral-600" style={{ width: `${drawPct}%` }} />
        <View className="h-full bg-neutral-900 dark:bg-neutral-100" style={{ width: `${lossPct}%` }} />
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{homeTeam}</Text>
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{awayTeam}</Text>
      </View>
    </View>
  );
}
