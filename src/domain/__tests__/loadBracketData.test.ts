jest.mock('../../api/footballDataClient');
jest.mock('../../api/cache', () => ({
  getCached: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { loadBracketData } from '../loadBracketData';
import { fetchWorldCupMatches, fetchWorldCupStandings } from '../../api/footballDataClient';

describe('loadBracketData', () => {
  it('fetches, caches, and normalizes standings and matches', async () => {
    (fetchWorldCupStandings as jest.Mock).mockResolvedValue({
      standings: [
        {
          group: 'GROUP_A',
          table: [
            {
              position: 1,
              team: { id: 1, name: 'Argentina' },
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
    (fetchWorldCupMatches as jest.Mock).mockResolvedValue({ matches: [] });

    const data = await loadBracketData({ apiKey: 'test-key' });

    expect(data.groups).toEqual([
      {
        groupName: 'GROUP_A',
        team: 'Argentina',
        played: 1,
        won: 1,
        draw: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        points: 3,
      },
    ]);
    expect(data.matches).toEqual([]);
  });
});
