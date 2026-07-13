import { BracketData } from './loadBracketData';
import { TeamRating } from './types';

export const MOCK_BRACKET_DATA: BracketData = {
  groups: [
    { groupName: 'GROUP_A', team: 'Argentina', played: 3, won: 2, draw: 1, lost: 0, goalsFor: 5, goalsAgainst: 1, points: 7 },
    { groupName: 'GROUP_A', team: 'France', played: 3, won: 2, draw: 0, lost: 1, goalsFor: 4, goalsAgainst: 3, points: 6 },
    { groupName: 'GROUP_A', team: 'Morocco', played: 3, won: 1, draw: 1, lost: 1, goalsFor: 2, goalsAgainst: 2, points: 4 },
    { groupName: 'GROUP_A', team: 'Canada', played: 3, won: 0, draw: 0, lost: 3, goalsFor: 1, goalsAgainst: 6, points: 0 },
    { groupName: 'GROUP_B', team: 'England', played: 3, won: 2, draw: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, points: 7 },
    { groupName: 'GROUP_B', team: 'Brazil', played: 3, won: 2, draw: 0, lost: 1, goalsFor: 5, goalsAgainst: 2, points: 6 },
    { groupName: 'GROUP_B', team: 'Japan', played: 3, won: 1, draw: 0, lost: 2, goalsFor: 3, goalsAgainst: 4, points: 3 },
    { groupName: 'GROUP_B', team: 'Ecuador', played: 3, won: 0, draw: 1, lost: 2, goalsFor: 1, goalsAgainst: 5, points: 1 },
  ],
  matches: [
    {
      id: 1001,
      stage: 'LAST_16',
      utcDate: '2026-06-30T18:00:00Z',
      homeTeam: 'Argentina',
      awayTeam: 'Japan',
      homeScore: 2,
      awayScore: 1,
      status: 'FINISHED',
    },
    {
      id: 1002,
      stage: 'LAST_16',
      utcDate: '2026-06-30T21:00:00Z',
      homeTeam: 'England',
      awayTeam: 'Morocco',
      homeScore: 1,
      awayScore: 1,
      status: 'FINISHED',
    },
    {
      id: 1003,
      stage: 'QUARTER_FINALS',
      utcDate: '2026-07-05T18:00:00Z',
      homeTeam: 'Argentina',
      awayTeam: 'TBD',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
    },
    {
      id: 1004,
      stage: 'QUARTER_FINALS',
      utcDate: '2026-07-05T21:00:00Z',
      homeTeam: 'TBD',
      awayTeam: 'TBD',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
    },
  ],
};

export const MOCK_RATINGS: Map<string, TeamRating> = new Map([
  ['Argentina', { team: 'Argentina', rating: 2100, source: 'seed' }],
  ['France', { team: 'France', rating: 2050, source: 'seed' }],
  ['Morocco', { team: 'Morocco', rating: 1880, source: 'seed' }],
  ['Canada', { team: 'Canada', rating: 1780, source: 'seed' }],
  ['England', { team: 'England', rating: 2010, source: 'seed' }],
  ['Brazil', { team: 'Brazil', rating: 2040, source: 'seed' }],
  ['Japan', { team: 'Japan', rating: 1850, source: 'seed' }],
  ['Ecuador', { team: 'Ecuador', rating: 1830, source: 'seed' }],
]);
