import React from 'react';
import { SafeAreaView, SectionList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBracketDataContext } from '../context/BracketDataContext';
import { BracketStackParamList } from '../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<BracketStackParamList, 'Bracket'>;

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
  const sections = groupNames.map((groupName) => ({
    title: groupName,
    data: bracket.groups.filter((g) => g.groupName === groupName),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        testID="bracket-list"
        sections={sections}
        keyExtractor={(item) => `${item.groupName}-${item.team}`}
        renderSectionHeader={({ section }) => <Text style={styles.groupHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TeamDetail', { team: item.team })}>
            <Text>{`${item.team} — ${item.points} pts`}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  groupHeader: { fontWeight: 'bold', padding: 8, backgroundColor: '#eee' },
});
