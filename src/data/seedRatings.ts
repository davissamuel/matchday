import seedData from '../../assets/data/fifa-ranking-seed.json';

export function loadSeedRatings(): Map<string, number> {
  return new Map(Object.entries(seedData as Record<string, number>));
}
