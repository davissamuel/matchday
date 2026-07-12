jest.mock('../../api/historicalResultsClient');
jest.mock('../../data/seedRatings');
jest.mock('../../api/cache', () => ({
  getCached: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { loadTeamRatings } from '../loadTeamRatings';
import { fetchHistoricalMatches } from '../../api/historicalResultsClient';
import { loadSeedRatings } from '../../data/seedRatings';
import { BracketMatch } from '../bracket';

describe('loadTeamRatings', () => {
  it('builds base ratings from history and seed, then applies finished World Cup results', async () => {
    (fetchHistoricalMatches as jest.Mock).mockResolvedValue([]);
    (loadSeedRatings as jest.Mock).mockReturnValue(new Map([['Argentina', 1800], ['Brazil', 1800]]));

    const finished: BracketMatch[] = [
      {
        id: 1,
        stage: 'GROUP_STAGE',
        utcDate: '2026-06-15T18:00:00Z',
        homeTeam: 'Argentina',
        awayTeam: 'Brazil',
        homeScore: 2,
        awayScore: 0,
        status: 'FINISHED',
      },
    ];

    const ratings = await loadTeamRatings(['Argentina', 'Brazil'], finished);

    expect(ratings.get('Argentina')!.rating).toBeGreaterThan(1800);
    expect(ratings.get('Brazil')!.rating).toBeLessThan(1800);
  });

  it('ignores unfinished or undetermined matches when updating ratings', async () => {
    (fetchHistoricalMatches as jest.Mock).mockResolvedValue([]);
    (loadSeedRatings as jest.Mock).mockReturnValue(new Map([['Argentina', 1800]]));

    const unfinished: BracketMatch[] = [
      {
        id: 2,
        stage: 'LAST_16',
        utcDate: '2026-07-01T18:00:00Z',
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
      },
    ];

    const ratings = await loadTeamRatings(['Argentina'], unfinished);
    expect(ratings.get('Argentina')!.rating).toBe(1800);
  });
});
