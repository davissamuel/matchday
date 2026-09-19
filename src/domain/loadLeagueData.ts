import { getCached } from '../api/cache';
import { fetchCompetitionMatches, fetchCompetitionStandings, FootballDataClientConfig } from '../api/footballDataClient';
import { normalizeLeagueMatches, normalizeLeagueStandings, LeagueMatch, LeagueStanding } from './league';

export interface LeagueData {
  standings: LeagueStanding[];
  matches: LeagueMatch[];
}

const TTL_MS = 5 * 60 * 1000;

export async function loadLeagueData(
  competitionCode: string,
  config: FootballDataClientConfig
): Promise<LeagueData> {
  const [standingsRaw, matchesRaw] = await Promise.all([
    getCached(`${competitionCode}-standings`, TTL_MS, () => fetchCompetitionStandings(competitionCode, config)),
    getCached(`${competitionCode}-matches`, TTL_MS, () => fetchCompetitionMatches(competitionCode, config)),
  ]);
  return {
    standings: normalizeLeagueStandings(standingsRaw),
    matches: normalizeLeagueMatches(matchesRaw),
  };
}
