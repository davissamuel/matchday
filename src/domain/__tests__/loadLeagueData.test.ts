jest.mock('../../api/footballDataClient', () => {
  const actual = jest.requireActual('../../api/footballDataClient');
  return {
    ...actual,
    fetchCompetitionStandings: jest.fn(),
    fetchCompetitionMatches: jest.fn(),
  };
});
jest.mock('../../api/cache', () => ({
  getCached: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { loadLeagueData } from '../loadLeagueData';
import {
  fetchCompetitionMatches,
  fetchCompetitionStandings,
  PREMIER_LEAGUE_CODE,
} from '../../api/footballDataClient';

describe('loadLeagueData', () => {
  it('fetches, caches, and normalizes standings and matches for the given competition', async () => {
    (fetchCompetitionStandings as jest.Mock).mockResolvedValue({
      standings: [
        {
          stage: 'REGULAR_SEASON',
          type: 'TOTAL',
          group: null,
          table: [
            {
              position: 1,
              team: { id: 1, name: 'Liverpool FC' },
              playedGames: 1,
              won: 1,
              draw: 0,
              lost: 0,
              points: 3,
              goalsFor: 2,
              goalsAgainst: 0,
            },
          ],
        },
      ],
    });
    (fetchCompetitionMatches as jest.Mock).mockResolvedValue({ matches: [] });

    const data = await loadLeagueData(PREMIER_LEAGUE_CODE, { apiKey: 'test-key' });

    expect(fetchCompetitionStandings).toHaveBeenCalledWith(PREMIER_LEAGUE_CODE, { apiKey: 'test-key' });
    expect(fetchCompetitionMatches).toHaveBeenCalledWith(PREMIER_LEAGUE_CODE, { apiKey: 'test-key' });
    expect(data.standings).toEqual([
      {
        position: 1,
        team: 'Liverpool FC',
        played: 1,
        won: 1,
        draw: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
      },
    ]);
    expect(data.matches).toEqual([]);
  });
});
