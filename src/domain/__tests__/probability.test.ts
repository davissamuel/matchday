import { matchProbability, simulateMatch } from '../probability';

describe('matchProbability', () => {
  it('gives equal win/loss probability for equal ratings', () => {
    const { winProbability, lossProbability } = matchProbability(1500, 1500);
    expect(winProbability).toBeCloseTo(lossProbability);
  });

  it('gives a non-zero draw probability for equal ratings', () => {
    const { drawProbability } = matchProbability(1500, 1500);
    expect(drawProbability).toBeGreaterThan(0);
  });

  it('sums win + draw + loss to 1', () => {
    const { winProbability, drawProbability, lossProbability } = matchProbability(1650, 1420);
    expect(winProbability + drawProbability + lossProbability).toBeCloseTo(1);
  });

  it('favors the higher-rated team', () => {
    const { winProbability, lossProbability } = matchProbability(1800, 1400);
    expect(winProbability).toBeGreaterThan(lossProbability);
  });
});

describe('simulateMatch', () => {
  it('returns HOME_TEAM when the rng roll is below the win threshold', () => {
    expect(simulateMatch(1800, 1400, () => 0)).toBe('HOME_TEAM');
  });

  it('returns AWAY_TEAM when the rng roll is at the top of the range', () => {
    expect(simulateMatch(1800, 1400, () => 0.999)).toBe('AWAY_TEAM');
  });
});
