import { LeagueData } from './loadLeagueData';

export const MOCK_LEAGUE_DATA: LeagueData = {
  standings: [
    { position: 1, team: 'Liverpool FC', played: 5, won: 4, draw: 1, lost: 0, goalsFor: 11, goalsAgainst: 3, goalDifference: 8, points: 13 },
    { position: 2, team: 'Arsenal FC', played: 5, won: 4, draw: 0, lost: 1, goalsFor: 9, goalsAgainst: 4, goalDifference: 5, points: 12 },
    { position: 3, team: 'Manchester City FC', played: 5, won: 3, draw: 1, lost: 1, goalsFor: 10, goalsAgainst: 6, goalDifference: 4, points: 10 },
    { position: 4, team: 'Chelsea FC', played: 5, won: 3, draw: 0, lost: 2, goalsFor: 8, goalsAgainst: 6, goalDifference: 2, points: 9 },
    { position: 5, team: 'Aston Villa FC', played: 5, won: 2, draw: 2, lost: 1, goalsFor: 7, goalsAgainst: 5, goalDifference: 2, points: 8 },
    { position: 6, team: 'Newcastle United FC', played: 5, won: 2, draw: 1, lost: 2, goalsFor: 6, goalsAgainst: 5, goalDifference: 1, points: 7 },
  ],
  matches: [
    {
      id: 2001,
      utcDate: '2026-09-13T14:00:00Z',
      status: 'FINISHED',
      homeTeam: 'Liverpool FC',
      awayTeam: 'Arsenal FC',
      homeScore: 2,
      awayScore: 1,
    },
    {
      id: 2002,
      utcDate: '2026-09-14T14:00:00Z',
      status: 'FINISHED',
      homeTeam: 'Chelsea FC',
      awayTeam: 'Manchester City FC',
      homeScore: 1,
      awayScore: 1,
    },
    {
      id: 2003,
      utcDate: '2026-09-27T14:00:00Z',
      status: 'SCHEDULED',
      homeTeam: 'Aston Villa FC',
      awayTeam: 'Liverpool FC',
      homeScore: null,
      awayScore: null,
    },
    {
      id: 2004,
      utcDate: '2026-09-28T14:00:00Z',
      status: 'SCHEDULED',
      homeTeam: 'Newcastle United FC',
      awayTeam: 'Arsenal FC',
      homeScore: null,
      awayScore: null,
    },
  ],
};
