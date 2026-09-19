export interface FootballDataTeamRef {
  id: number | null;
  name: string | null;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: FootballDataTeamRef;
  awayTeam: FootballDataTeamRef;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

export interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

export interface FootballDataStandingTableRow {
  position: number;
  team: { id: number; name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface FootballDataStandingsGroup {
  stage: string;
  type: 'TOTAL' | 'HOME' | 'AWAY';
  group: string | null;
  table: FootballDataStandingTableRow[];
}

export interface FootballDataStandingsResponse {
  standings: FootballDataStandingsGroup[];
}

export interface FootballDataClientConfig {
  apiKey: string;
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.football-data.org/v4';

async function get<T>(path: string, config: FootballDataClientConfig): Promise<T> {
  const fetchFn = config.fetchFn ?? fetch;
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const response = await fetchFn(`${baseUrl}${path}`, {
    headers: { 'X-Auth-Token': config.apiKey },
  });
  if (!response.ok) {
    throw new Error(`football-data.org request to ${path} failed: ${response.status}`);
  }
  return response.json();
}

export const PREMIER_LEAGUE_CODE = 'PL';

export function fetchCompetitionMatches(
  competitionCode: string,
  config: FootballDataClientConfig
): Promise<FootballDataMatchesResponse> {
  return get<FootballDataMatchesResponse>(`/competitions/${competitionCode}/matches`, config);
}

export function fetchCompetitionStandings(
  competitionCode: string,
  config: FootballDataClientConfig
): Promise<FootballDataStandingsResponse> {
  return get<FootballDataStandingsResponse>(`/competitions/${competitionCode}/standings`, config);
}
