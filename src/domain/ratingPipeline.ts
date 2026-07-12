import { HistoricalMatch, TeamRating } from './types';
import { applyResults, DEFAULT_RATING } from './elo';

export function buildTeamRatings(
  teams: string[],
  historicalMatches: HistoricalMatch[],
  seedRatings: Map<string, number>,
  defaultRating: number = DEFAULT_RATING
): Map<string, TeamRating> {
  const teamsWithHistory = new Set<string>();
  for (const match of historicalMatches) {
    teamsWithHistory.add(match.homeTeam);
    teamsWithHistory.add(match.awayTeam);
  }

  const initial = new Map<string, number>();
  for (const team of teams) {
    if (teamsWithHistory.has(team)) continue;
    initial.set(team, seedRatings.get(team) ?? defaultRating);
  }

  const computed = applyResults(initial, historicalMatches, defaultRating);

  const result = new Map<string, TeamRating>();
  for (const team of teams) {
    const rating = computed.get(team) ?? seedRatings.get(team) ?? defaultRating;
    const source: TeamRating['source'] = teamsWithHistory.has(team)
      ? 'history'
      : seedRatings.has(team)
        ? 'seed'
        : 'default';
    result.set(team, { team, rating, source });
  }
  return result;
}
