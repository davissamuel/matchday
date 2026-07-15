import React from 'react';
import { SectionList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { GroupStanding, BracketMatch } from '../domain/bracket';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { MatchCard } from '../components/MatchCard';
import { colors } from '../theme/colors';

type Navigation = NativeStackNavigationProp<BracketStackParamList, 'Bracket'>;

const STAGE_LABELS: Record<string, string> = {
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarterfinals',
  SEMI_FINALS: 'Semifinals',
  FINAL: 'Final',
};

const STAGE_ORDER = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'] as const;

interface GroupSection {
  kind: 'group';
  title: string;
  data: GroupStanding[];
}

interface KnockoutSection {
  kind: 'knockout';
  title: string;
  data: BracketMatch[];
}

type Section = GroupSection | KnockoutSection;

export default function BracketScreen() {
  const navigation = useNavigation<Navigation>();
  const { bracket, error } = useBracketDataContext();

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="bracket-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!bracket) {
    return (
      <ScreenContainer>
        <ActivityIndicator testID="bracket-loading" color={colors.light.accent} className="mt-4" />
      </ScreenContainer>
    );
  }

  const groupNames = Array.from(new Set(bracket.groups.map((g) => g.groupName))).sort();
  const groupSections: GroupSection[] = groupNames.map((groupName) => ({
    kind: 'group',
    title: groupName,
    data: bracket.groups.filter((g) => g.groupName === groupName),
  }));

  const knockoutStages = Array.from(new Set(bracket.matches.map((m) => m.stage))).filter(
    (stage) => stage !== 'GROUP_STAGE'
  );
  const orderedKnownStages = STAGE_ORDER.filter((stage) => knockoutStages.includes(stage));
  const unknownStages = knockoutStages.filter((stage) => !STAGE_ORDER.includes(stage));
  const allKnockoutStages = [...orderedKnownStages, ...unknownStages];

  const knockoutSections: KnockoutSection[] = allKnockoutStages.map((stage) => ({
    kind: 'knockout',
    title: STAGE_LABELS[stage] ?? stage,
    data: bracket.matches.filter((m) => m.stage === stage),
  }));

  const sections: Section[] = [...groupSections, ...knockoutSections];

  return (
    <ScreenContainer>
      <SectionList
        testID="bracket-list"
        sections={sections}
        keyExtractor={(item, index) =>
          'groupName' in item ? `${item.groupName}-${(item as GroupStanding).team}` : `match-${(item as BracketMatch).id}-${index}`
        }
        renderSectionHeader={({ section }) => (
          <Text className="mt-4 bg-neutral-100 px-2 py-2 font-bold text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50">
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) => {
          if (section.kind === 'group') {
            const standing = item as GroupStanding;
            const qualifying = bracket.groups
              .filter((g) => g.groupName === standing.groupName)
              .sort((a, b) => b.points - a.points)
              .slice(0, 2)
              .some((g) => g.team === standing.team);
            return (
              <TouchableOpacity
                testID={`standing-row-${standing.team}`}
                onPress={() => navigation.navigate('TeamDetail', { team: standing.team })}
                className={`flex-row items-center justify-between border-l-4 px-2 py-2 ${
                  qualifying ? 'border-accent dark:border-accent-dark' : 'border-transparent'
                }`}
              >
                <FlagLabel team={standing.team} />
                <Text
                  className={`text-neutral-900 dark:text-neutral-50 ${qualifying ? 'font-bold' : 'font-normal'}`}
                >{`${standing.points} pts`}</Text>
              </TouchableOpacity>
            );
          }
          const match = item as BracketMatch;
          return <MatchCard match={match} testID={`knockout-match-${match.id}`} />;
        }}
      />
    </ScreenContainer>
  );
}
