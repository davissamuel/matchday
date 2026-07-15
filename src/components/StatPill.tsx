import React from 'react';
import { Text, View } from 'react-native';

interface StatPillProps {
  label: string;
  value: string;
  testID?: string;
}

export function StatPill({ label, value, testID }: StatPillProps) {
  return (
    <View
      testID={testID}
      className="mt-2 flex-row items-center gap-2 self-start rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
    >
      <Text className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">{value}</Text>
    </View>
  );
}
