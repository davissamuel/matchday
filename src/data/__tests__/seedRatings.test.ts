import { loadSeedRatings } from '../seedRatings';

describe('loadSeedRatings', () => {
  it('loads seed data into a Map keyed by team name', () => {
    const ratings = loadSeedRatings();
    expect(ratings.get('Argentina')).toBe(2100);
  });

  it('returns undefined for teams not present in the seed file', () => {
    const ratings = loadSeedRatings();
    expect(ratings.get('Atlantis')).toBeUndefined();
  });
});
