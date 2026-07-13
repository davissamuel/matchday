import { buildTeamRatings } from '../ratingPipeline';
import { HistoricalMatch } from '../types';
import { DEFAULT_RATING } from '../elo';

describe('buildTeamRatings', () => {
  it('marks a team as source "history" when it appears in historical matches', () => {
    const matches: HistoricalMatch[] = [
      { date: '2023-01-01', homeTeam: 'Argentina', awayTeam: 'Brazil', homeScore: 1, awayScore: 0 },
    ];
    const result = buildTeamRatings(['Argentina', 'Brazil'], matches, new Map());
    expect(result.get('Argentina')?.source).toBe('history');
    expect(result.get('Argentina')?.rating).toBeGreaterThan(DEFAULT_RATING);
  });

  it('falls back to the seed rating when a team has no history', () => {
    const result = buildTeamRatings(['Qatar'], [], new Map([['Qatar', 1650]]));
    expect(result.get('Qatar')).toEqual({ team: 'Qatar', rating: 1650, source: 'seed' });
  });

  it('falls back to the default rating when a team has neither history nor a seed', () => {
    const result = buildTeamRatings(['NewTeam'], [], new Map());
    expect(result.get('NewTeam')).toEqual({ team: 'NewTeam', rating: DEFAULT_RATING, source: 'default' });
  });

  it('uses the seed rating as the starting point when a team also has historical matches', () => {
    const matches: HistoricalMatch[] = [
      { date: '2023-01-01', homeTeam: 'Argentina', awayTeam: 'Brazil', homeScore: 1, awayScore: 0 },
    ];
    const seedRatings = new Map([['Argentina', 2000]]);
    const result = buildTeamRatings(['Argentina'], matches, seedRatings);
    expect(result.get('Argentina')?.source).toBe('history');
    expect(result.get('Argentina')?.rating).toBeGreaterThan(2000);
  });
});
