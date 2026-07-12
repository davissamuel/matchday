import { getCached } from '../api/cache';
import { fetchHistoricalMatches } from '../api/historicalResultsClient';
import { loadSeedRatings } from '../data/seedRatings';
import { buildTeamRatings } from './ratingPipeline';
import { applyResults } from './elo';
import { TeamRating, HistoricalMatch } from './types';
import { BracketMatch } from './bracket';

const TTL_MS = 24 * 60 * 60 * 1000;
const HISTORY_SINCE_YEAR = 2014;

function toHistoricalMatches(matches: BracketMatch[]): HistoricalMatch[] {
  return matches
    .filter(
      (m) =>
        m.status === 'FINISHED' &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        m.homeTeam !== 'TBD' &&
        m.awayTeam !== 'TBD'
    )
    .map((m) => ({
      date: m.utcDate.slice(0, 10),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore as number,
      awayScore: m.awayScore as number,
    }));
}

export async function loadTeamRatings(
  teams: string[],
  finishedWorldCupMatches: BracketMatch[] = []
): Promise<Map<string, TeamRating>> {
  const historicalMatches = await getCached('historical-matches', TTL_MS, () =>
    fetchHistoricalMatches(HISTORY_SINCE_YEAR)
  );
  const seedRatings = loadSeedRatings();
  const base = buildTeamRatings(teams, historicalMatches, seedRatings);

  const baseRatingsMap = new Map(Array.from(base.entries()).map(([team, r]) => [team, r.rating]));
  const updated = applyResults(baseRatingsMap, toHistoricalMatches(finishedWorldCupMatches));

  const result = new Map<string, TeamRating>();
  for (const [team, teamRating] of base) {
    result.set(team, { ...teamRating, rating: updated.get(team) ?? teamRating.rating });
  }
  return result;
}
