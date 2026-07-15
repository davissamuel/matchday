import React from 'react';
import { Text, View } from 'react-native';
import { flagEmoji } from '../domain/flags';

interface FlagLabelProps {
  team: string;
  className?: string;
}

export function FlagLabel({ team, className }: FlagLabelProps) {
  const flag = flagEmoji(team);
  return (
    <View className={`flex-row items-center gap-1.5 ${className ?? ''}`}>
      {flag ? <Text>{flag}</Text> : null}
      <Text className="text-neutral-900 dark:text-neutral-50">{team}</Text>
    </View>
  );
}
