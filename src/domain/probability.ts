import { MatchOutcome } from './types';

export interface MatchProbability {
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
}

export const DRAW_MARGIN = 100;

export function matchProbability(ratingA: number, ratingB: number): MatchProbability {
  const dr = ratingA - ratingB;
  const winProbability = 1 / (1 + Math.pow(10, -(dr - DRAW_MARGIN) / 400));
  const lossProbability = 1 / (1 + Math.pow(10, (dr + DRAW_MARGIN) / 400));
  const drawProbability = Math.max(0, 1 - winProbability - lossProbability);
  return { winProbability, drawProbability, lossProbability };
}

export function simulateMatch(
  ratingA: number,
  ratingB: number,
  rng: () => number = Math.random
): MatchOutcome {
  const { winProbability, drawProbability } = matchProbability(ratingA, ratingB);
  const roll = rng();
  if (roll < winProbability) return 'HOME_TEAM';
  if (roll < winProbability + drawProbability) return 'DRAW';
  return 'AWAY_TEAM';
}
