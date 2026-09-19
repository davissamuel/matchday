import { normalizeLeagueStandings, normalizeLeagueMatches, splitResultsAndFixtures } from '../league';
import { FootballDataStandingsResponse, FootballDataMatchesResponse } from '../../api/footballDataClient';

describe('normalizeLeagueStandings', () => {
  it('reads the TOTAL table into a flat, position-sorted standings list', () => {
    const raw: FootballDataStandingsResponse = {
      standings: [
        {
          stage: 'REGULAR_SEASON',
          type: 'TOTAL',
          group: null,
          table: [
            {
              position: 2,
              team: { id: 2, name: 'Arsenal FC' },
              playedGames: 5,
              won: 3,
              draw: 1,
              lost: 1,
              points: 10,
              goalsFor: 9,
              goalsAgainst: 5,
            },
            {
              position: 1,
              team: { id: 1, name: 'Liverpool FC' },
              playedGames: 5,
              won: 4,
              draw: 0,
              lost: 1,
              points: 12,
              goalsFor: 11,
              goalsAgainst: 4,
            },
          ],
        },
        {
          stage: 'REGULAR_SEASON',
          type: 'HOME',
          group: null,
          table: [],
        },
      ],
    };
    const result = normalizeLeagueStandings(raw);
    expect(result).toEqual([
      {
        position: 1,
        team: 'Liverpool FC',
        played: 5,
        won: 4,
        draw: 0,
        lost: 1,
        goalsFor: 11,
        goalsAgainst: 4,
        goalDifference: 7,
        points: 12,
      },
      {
        position: 2,
        team: 'Arsenal FC',
        played: 5,
        won: 3,
        draw: 1,
        lost: 1,
        goalsFor: 9,
        goalsAgainst: 5,
        goalDifference: 4,
        points: 10,
      },
    ]);
  });

  it('returns an empty list when no TOTAL table is present', () => {
    const raw: FootballDataStandingsResponse = {
      standings: [{ stage: 'REGULAR_SEASON', type: 'HOME', group: null, table: [] }],
    };
    expect(normalizeLeagueStandings(raw)).toEqual([]);
  });
});

describe('normalizeLeagueMatches', () => {
  it('maps a finished match with both teams known', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 1,
          utcDate: '2026-09-13T14:00:00Z',
          status: 'FINISHED',
          stage: 'REGULAR_SEASON',
          homeTeam: { id: 1, name: 'Liverpool FC' },
          awayTeam: { id: 2, name: 'Arsenal FC' },
          score: { fullTime: { home: 2, away: 1 } },
        },
      ],
    };
    expect(normalizeLeagueMatches(raw)).toEqual([
      {
        id: 1,
        utcDate: '2026-09-13T14:00:00Z',
        status: 'FINISHED',
        homeTeam: 'Liverpool FC',
        awayTeam: 'Arsenal FC',
        homeScore: 2,
        awayScore: 1,
      },
    ]);
  });

  it('maps an unknown team to "TBD"', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 2,
          utcDate: '2026-09-20T14:00:00Z',
          status: 'SCHEDULED',
          stage: 'REGULAR_SEASON',
          homeTeam: { id: null, name: null },
          awayTeam: { id: null, name: null },
          score: { fullTime: { home: null, away: null } },
        },
      ],
    };
    const result = normalizeLeagueMatches(raw);
    expect(result[0].homeTeam).toBe('TBD');
    expect(result[0].awayTeam).toBe('TBD');
  });
});

describe('splitResultsAndFixtures', () => {
  it('sorts finished matches most-recent-first and unfinished matches soonest-first', () => {
    const matches = [
      {
        id: 1,
        utcDate: '2026-09-01T14:00:00Z',
        status: 'FINISHED',
        homeTeam: 'A',
        awayTeam: 'B',
        homeScore: 1,
        awayScore: 0,
      },
      {
        id: 2,
        utcDate: '2026-09-15T14:00:00Z',
        status: 'FINISHED',
        homeTeam: 'C',
        awayTeam: 'D',
        homeScore: 2,
        awayScore: 2,
      },
      {
        id: 3,
        utcDate: '2026-10-01T14:00:00Z',
        status: 'SCHEDULED',
        homeTeam: 'E',
        awayTeam: 'F',
        homeScore: null,
        awayScore: null,
      },
      {
        id: 4,
        utcDate: '2026-09-25T14:00:00Z',
        status: 'SCHEDULED',
        homeTeam: 'G',
        awayTeam: 'H',
        homeScore: null,
        awayScore: null,
      },
    ];
    const { results, fixtures } = splitResultsAndFixtures(matches);
    expect(results.map((m) => m.id)).toEqual([2, 1]);
    expect(fixtures.map((m) => m.id)).toEqual([4, 3]);
  });
});
