import { FootballDataMatchesResponse, FootballDataStandingsResponse } from '../api/footballDataClient';

export interface LeagueStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
}

export function normalizeLeagueStandings(raw: FootballDataStandingsResponse): LeagueStanding[] {
  const totalTable = raw.standings.find((group) => group.type === 'TOTAL');
  if (!totalTable) return [];
  return totalTable.table
    .map((row) => ({
      position: row.position,
      team: row.team.name,
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalsFor - row.goalsAgainst,
      points: row.points,
    }))
    .sort((a, b) => a.position - b.position);
}

export function normalizeLeagueMatches(raw: FootballDataMatchesResponse): LeagueMatch[] {
  return raw.matches.map((match) => ({
    id: match.id,
    utcDate: match.utcDate,
    status: match.status,
    homeTeam: match.homeTeam.name ?? 'TBD',
    awayTeam: match.awayTeam.name ?? 'TBD',
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
  }));
}

export function splitResultsAndFixtures(matches: LeagueMatch[]): {
  results: LeagueMatch[];
  fixtures: LeagueMatch[];
} {
  const results = matches
    .filter((match) => match.status === 'FINISHED')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  const fixtures = matches
    .filter((match) => match.status !== 'FINISHED')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  return { results, fixtures };
}
