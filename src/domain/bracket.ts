import { FootballDataMatchesResponse, FootballDataStandingsResponse } from '../api/footballDataClient';
import { normalizeTeamName } from './teamNameAliases';

export type Stage =
  | 'GROUP_STAGE'
  | 'LAST_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'FINAL';

export interface GroupStanding {
  groupName: string;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface BracketMatch {
  id: number;
  stage: Stage;
  utcDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

export function normalizeStandings(raw: FootballDataStandingsResponse): GroupStanding[] {
  const result: GroupStanding[] = [];
  for (const group of raw.standings) {
    if (!group.group) continue;
    for (const row of group.table) {
      result.push({
        groupName: group.group,
        team: normalizeTeamName(row.team.name),
        played: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      });
    }
  }
  return result;
}

export function normalizeMatches(raw: FootballDataMatchesResponse): BracketMatch[] {
  return raw.matches.map((match) => ({
    id: match.id,
    stage: match.stage as Stage,
    utcDate: match.utcDate,
    homeTeam: match.homeTeam.name ? normalizeTeamName(match.homeTeam.name) : 'TBD',
    awayTeam: match.awayTeam.name ? normalizeTeamName(match.awayTeam.name) : 'TBD',
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
    status: match.status,
  }));
}
