import React from 'react';
import { SectionList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';
import { GroupStanding, BracketMatch, formatMatchLine } from '../domain/bracket';

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
      <SafeAreaView style={styles.container}>
        <Text testID="bracket-error">{error}</Text>
      </SafeAreaView>
    );
  }

  if (!bracket) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator testID="bracket-loading" />
      </SafeAreaView>
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
    <SafeAreaView style={styles.container}>
      <SectionList
        testID="bracket-list"
        sections={sections}
        keyExtractor={(item, index) =>
          'groupName' in item ? `${item.groupName}-${(item as GroupStanding).team}` : `match-${(item as BracketMatch).id}-${index}`
        }
        renderSectionHeader={({ section }) => <Text style={styles.groupHeader}>{section.title}</Text>}
        renderItem={({ item, section }) => {
          if (section.kind === 'group') {
            const standing = item as GroupStanding;
            return (
              <TouchableOpacity onPress={() => navigation.navigate('TeamDetail', { team: standing.team })}>
                <Text>{`${standing.team} — ${standing.points} pts`}</Text>
              </TouchableOpacity>
            );
          }
          const match = item as BracketMatch;
          return <Text testID={`knockout-match-${match.id}`}>{formatMatchLine(match)}</Text>;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  groupHeader: { fontWeight: 'bold', padding: 8, backgroundColor: '#eee' },
});
