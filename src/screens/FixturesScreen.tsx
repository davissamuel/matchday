import React from 'react';
import { SectionList, Text, ActivityIndicator } from 'react-native';
import { useLeagueDataContext } from '../context/LeagueDataContext';
import { LeagueMatch, splitResultsAndFixtures } from '../domain/league';
import { ScreenContainer } from '../components/ScreenContainer';
import { MatchCard } from '../components/MatchCard';
import { colors } from '../theme/colors';

interface Section {
  title: string;
  data: LeagueMatch[];
}

export default function FixturesScreen() {
  const { matches, error } = useLeagueDataContext();

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="fixtures-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!matches) {
    return (
      <ScreenContainer>
        <ActivityIndicator testID="fixtures-loading" color={colors.light.accent} className="mt-4" />
      </ScreenContainer>
    );
  }

  const { results, fixtures } = splitResultsAndFixtures(matches);
  const sections: Section[] = [
    { title: 'Results', data: results },
    { title: 'Fixtures', data: fixtures },
  ];

  return (
    <ScreenContainer>
      <SectionList
        testID="fixtures-list"
        sections={sections}
        keyExtractor={(item) => `match-${item.id}`}
        renderSectionHeader={({ section }) => (
          <Text className="mt-4 bg-neutral-100 px-2 py-2 font-bold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <MatchCard match={item} testID={`fixture-match-${item.id}`} />}
      />
    </ScreenContainer>
  );
}
