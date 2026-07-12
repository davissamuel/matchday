import React, { useState } from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBracketDataContext } from '../context/BracketDataContext';
import { matchProbability, simulateMatch } from '../domain/probability';

export default function SimulationScreen() {
  const { bracket, ratings } = useBracketDataContext();
  const [teamA, setTeamA] = useState<string | null>(null);
  const [teamB, setTeamB] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (!bracket || !ratings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text testID="simulation-loading">Loading teams…</Text>
      </SafeAreaView>
    );
  }

  const teams = Array.from(new Set(bracket.groups.map((g) => g.team))).sort();
  const probability =
    teamA && teamB ? matchProbability(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Team A</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`a-${team}`}
            testID={`team-a-${team}`}
            onPress={() => {
              setTeamA(team);
              setResult(null);
            }}
          >
            <Text style={team === teamA ? styles.selected : styles.option}>{team}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.sectionTitle}>Team B</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`b-${team}`}
            testID={`team-b-${team}`}
            onPress={() => {
              setTeamB(team);
              setResult(null);
            }}
          >
            <Text style={team === teamB ? styles.selected : styles.option}>{team}</Text>
          </TouchableOpacity>
        ))}
        {probability && (
          <Text testID="probability-display">
            {`${teamA} win ${Math.round(probability.winProbability * 100)}% · draw ${Math.round(
              probability.drawProbability * 100
            )}% · ${teamB} win ${Math.round(probability.lossProbability * 100)}%`}
          </Text>
        )}
        {teamA && teamB && (
          <TouchableOpacity
            testID="simulate-button"
            onPress={() => {
              const outcome = simulateMatch(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating);
              const label = outcome === 'HOME_TEAM' ? teamA : outcome === 'AWAY_TEAM' ? teamB : 'Draw';
              setResult(`Result: ${label}`);
            }}
          >
            <Text style={styles.simulateButton}>Simulate Match</Text>
          </TouchableOpacity>
        )}
        {result && <Text testID="simulation-result">{result}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: 'bold', marginTop: 12 },
  option: { padding: 6 },
  selected: { padding: 6, fontWeight: 'bold', color: 'blue' },
  simulateButton: { padding: 12, marginTop: 12, backgroundColor: '#ddd', textAlign: 'center' },
});
