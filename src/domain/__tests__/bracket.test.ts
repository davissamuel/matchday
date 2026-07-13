import { normalizeStandings, normalizeMatches } from '../bracket';
import { FootballDataStandingsResponse, FootballDataMatchesResponse } from '../../api/footballDataClient';

describe('normalizeStandings', () => {
  it('flattens groups into GroupStanding rows and normalizes team names', () => {
    const raw: FootballDataStandingsResponse = {
      standings: [
        {
          group: 'GROUP_A',
          table: [
            {
              position: 1,
              team: { id: 1, name: 'Korea Republic' },
              playedGames: 3,
              won: 2,
              draw: 1,
              lost: 0,
              points: 7,
              goalsFor: 5,
              goalsAgainst: 1,
            },
          ],
        },
        { group: null, table: [] },
      ],
    };
    const result = normalizeStandings(raw);
    expect(result).toEqual([
      {
        groupName: 'GROUP_A',
        team: 'South Korea',
        played: 3,
        won: 2,
        draw: 1,
        lost: 0,
        goalsFor: 5,
        goalsAgainst: 1,
        points: 7,
      },
    ]);
  });
});

describe('normalizeMatches', () => {
  it('maps a finished match with both teams known', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 1,
          utcDate: '2026-06-15T18:00:00Z',
          status: 'FINISHED',
          stage: 'GROUP_STAGE',
          homeTeam: { id: 1, name: 'USA' },
          awayTeam: { id: 2, name: 'Wales' },
          score: { fullTime: { home: 2, away: 1 } },
        },
      ],
    };
    const result = normalizeMatches(raw);
    expect(result).toEqual([
      {
        id: 1,
        stage: 'GROUP_STAGE',
        utcDate: '2026-06-15T18:00:00Z',
        homeTeam: 'United States',
        awayTeam: 'Wales',
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED',
      },
    ]);
  });

  it('maps an undetermined knockout slot to "TBD"', () => {
    const raw: FootballDataMatchesResponse = {
      matches: [
        {
          id: 2,
          utcDate: '2026-07-01T18:00:00Z',
          status: 'SCHEDULED',
          stage: 'LAST_16',
          homeTeam: { id: null, name: null },
          awayTeam: { id: null, name: null },
          score: { fullTime: { home: null, away: null } },
        },
      ],
    };
    const result = normalizeMatches(raw);
    expect(result[0].homeTeam).toBe('TBD');
    expect(result[0].awayTeam).toBe('TBD');
  });
});
