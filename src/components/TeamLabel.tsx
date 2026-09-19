import React from 'react';
import { Text } from 'react-native';

interface TeamLabelProps {
  team: string;
  className?: string;
}

export function TeamLabel({ team, className }: TeamLabelProps) {
  return <Text className={`text-neutral-900 dark:text-neutral-50 ${className ?? ''}`}>{team}</Text>;
}
