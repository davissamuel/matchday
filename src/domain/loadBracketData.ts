import { getCached } from '../api/cache';
import {
  fetchWorldCupMatches,
  fetchWorldCupStandings,
  FootballDataClientConfig,
} from '../api/footballDataClient';
import { normalizeMatches, normalizeStandings, BracketMatch, GroupStanding } from './bracket';

export interface BracketData {
  groups: GroupStanding[];
  matches: BracketMatch[];
}

const TTL_MS = 5 * 60 * 1000;

export async function loadBracketData(config: FootballDataClientConfig): Promise<BracketData> {
  const [standingsRaw, matchesRaw] = await Promise.all([
    getCached('wc-standings', TTL_MS, () => fetchWorldCupStandings(config)),
    getCached('wc-matches', TTL_MS, () => fetchWorldCupMatches(config)),
  ]);
  return {
    groups: normalizeStandings(standingsRaw),
    matches: normalizeMatches(matchesRaw),
  };
}
