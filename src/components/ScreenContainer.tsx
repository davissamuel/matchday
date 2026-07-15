import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  testID?: string;
}

export function ScreenContainer({ children, testID }: ScreenContainerProps) {
  return (
    <SafeAreaView testID={testID} className="flex-1 bg-neutral-50 px-4 dark:bg-neutral-950">
      {children}
    </SafeAreaView>
  );
}
