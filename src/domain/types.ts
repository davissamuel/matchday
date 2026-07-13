export type MatchOutcome = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW';

export interface HistoricalMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamRating {
  team: string;
  rating: number;
  source: 'history' | 'seed' | 'default';
}
