import { expectedScore, updateRatings, computeRatingsFromHistory, applyResults, DEFAULT_RATING } from '../elo';
import { HistoricalMatch } from '../types';

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it('returns a higher score for the stronger team', () => {
    expect(expectedScore(1700, 1500)).toBeGreaterThan(0.5);
  });
});

describe('updateRatings', () => {
  it('increases the winner rating and decreases the loser rating', () => {
    const { ratingA, ratingB } = updateRatings(1500, 1500, 'HOME_TEAM');
    expect(ratingA).toBeGreaterThan(1500);
    expect(ratingB).toBeLessThan(1500);
  });

  it('leaves equal ratings unchanged on a draw', () => {
    const { ratingA, ratingB } = updateRatings(1500, 1500, 'DRAW');
    expect(ratingA).toBeCloseTo(1500);
    expect(ratingB).toBeCloseTo(1500);
  });
});

describe('computeRatingsFromHistory', () => {
  it('processes matches in chronological order and returns final ratings', () => {
    const matches: HistoricalMatch[] = [
      { date: '2020-01-01', homeTeam: 'A', awayTeam: 'B', homeScore: 2, awayScore: 0 },
      { date: '2020-02-01', homeTeam: 'B', awayTeam: 'A', homeScore: 1, awayScore: 1 },
    ];
    const ratings = computeRatingsFromHistory(matches);
    expect(ratings.get('A')).toBeGreaterThan(DEFAULT_RATING);
    expect(ratings.get('B')).toBeLessThan(DEFAULT_RATING);
  });

  it('uses the default rating for teams with no prior history', () => {
    const ratings = computeRatingsFromHistory([]);
    expect(ratings.size).toBe(0);
  });
});

describe('applyResults', () => {
  it('starts from provided initial ratings instead of the default', () => {
    const initial = new Map([['A', 1800], ['B', 1500]]);
    const matches: HistoricalMatch[] = [
      { date: '2021-01-01', homeTeam: 'A', awayTeam: 'B', homeScore: 0, awayScore: 3 },
    ];
    const updated = applyResults(initial, matches);
    expect(updated.get('A')).toBeLessThan(1800);
    expect(updated.get('B')).toBeGreaterThan(1500);
  });
});
