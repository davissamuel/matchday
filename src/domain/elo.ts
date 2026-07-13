import { HistoricalMatch, MatchOutcome } from './types';

export const DEFAULT_RATING = 1500;
export const K_FACTOR = 20;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateRatings(
  ratingA: number,
  ratingB: number,
  outcome: MatchOutcome
): { ratingA: number; ratingB: number } {
  const scoreA = outcome === 'HOME_TEAM' ? 1 : outcome === 'AWAY_TEAM' ? 0 : 0.5;
  const scoreB = 1 - scoreA;
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  return {
    ratingA: ratingA + K_FACTOR * (scoreA - expectedA),
    ratingB: ratingB + K_FACTOR * (scoreB - expectedB),
  };
}

function outcomeFromScore(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return 'HOME_TEAM';
  if (homeScore < awayScore) return 'AWAY_TEAM';
  return 'DRAW';
}

export function applyResults(
  initialRatings: Map<string, number>,
  matches: HistoricalMatch[],
  defaultRating: number = DEFAULT_RATING
): Map<string, number> {
  const ratings = new Map(initialRatings);
  const getRating = (team: string) => ratings.get(team) ?? defaultRating;
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const match of sorted) {
    const ratingA = getRating(match.homeTeam);
    const ratingB = getRating(match.awayTeam);
    const outcome = outcomeFromScore(match.homeScore, match.awayScore);
    const updated = updateRatings(ratingA, ratingB, outcome);
    ratings.set(match.homeTeam, updated.ratingA);
    ratings.set(match.awayTeam, updated.ratingB);
  }

  return ratings;
}

export function computeRatingsFromHistory(
  matches: HistoricalMatch[],
  initialRating: number = DEFAULT_RATING
): Map<string, number> {
  return applyResults(new Map(), matches, initialRating);
}
