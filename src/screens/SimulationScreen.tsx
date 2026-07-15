import React, { useState } from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { useBracketDataContext } from '../context/BracketDataContext';
import { matchProbability, simulateMatch } from '../domain/probability';
import { ScreenContainer } from '../components/ScreenContainer';
import { FlagLabel } from '../components/FlagLabel';
import { ProbabilityBar } from '../components/ProbabilityBar';

export default function SimulationScreen() {
  const { bracket, ratings, error } = useBracketDataContext();
  const [teamA, setTeamA] = useState<string | null>(null);
  const [teamB, setTeamB] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (error) {
    return (
      <ScreenContainer>
        <Text testID="simulation-error" className="mt-4 text-neutral-900 dark:text-neutral-50">
          {error}
        </Text>
      </ScreenContainer>
    );
  }

  if (!bracket || !ratings) {
    return (
      <ScreenContainer>
        <Text testID="simulation-loading" className="mt-4 text-neutral-500 dark:text-neutral-400">
          Loading teams…
        </Text>
      </ScreenContainer>
    );
  }

  const teams = Array.from(new Set(bracket.groups.map((g) => g.team))).sort();
  const probability =
    teamA && teamB ? matchProbability(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating) : null;

  return (
    <ScreenContainer>
      <ScrollView>
        <Text className="mt-4 font-bold text-neutral-900 dark:text-neutral-50">Team A</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`a-${team}`}
            testID={`team-a-${team}`}
            onPress={() => {
              setTeamA(team);
              setResult(null);
            }}
            className={`rounded-md px-2 py-1.5 ${team === teamA ? 'bg-accent/10' : ''}`}
          >
            <FlagLabel team={team} />
          </TouchableOpacity>
        ))}
        <Text className="mt-4 font-bold text-neutral-900 dark:text-neutral-50">Team B</Text>
        {teams.map((team) => (
          <TouchableOpacity
            key={`b-${team}`}
            testID={`team-b-${team}`}
            onPress={() => {
              setTeamB(team);
              setResult(null);
            }}
            className={`rounded-md px-2 py-1.5 ${team === teamB ? 'bg-accent/10' : ''}`}
          >
            <FlagLabel team={team} />
          </TouchableOpacity>
        ))}
        {probability && teamA && teamB && (
          <ProbabilityBar
            testID="probability-display"
            homeTeam={teamA}
            awayTeam={teamB}
            winProbability={probability.winProbability}
            drawProbability={probability.drawProbability}
            lossProbability={probability.lossProbability}
          />
        )}
        {teamA && teamB && (
          <TouchableOpacity
            testID="simulate-button"
            onPress={() => {
              const outcome = simulateMatch(ratings.get(teamA)!.rating, ratings.get(teamB)!.rating);
              const label = outcome === 'HOME_TEAM' ? teamA : outcome === 'AWAY_TEAM' ? teamB : 'Draw';
              setResult(`Result: ${label}`);
            }}
            className="mt-4 rounded-full bg-accent px-4 py-3"
          >
            <Text className="text-center font-bold text-white">Simulate Match</Text>
          </TouchableOpacity>
        )}
        {result && (
          <Text testID="simulation-result" className="mt-4 text-center text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {result}
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
