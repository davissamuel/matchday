import { MOCK_BRACKET_DATA, MOCK_RATINGS } from '../mockData';

describe('mockData', () => {
  it('provides at least one group standing and one knockout match', () => {
    expect(MOCK_BRACKET_DATA.groups.length).toBeGreaterThan(0);
    expect(MOCK_BRACKET_DATA.matches.some((m) => m.stage !== 'GROUP_STAGE')).toBe(true);
  });

  it('provides a rating for every team appearing in the mock groups', () => {
    const teams = new Set(MOCK_BRACKET_DATA.groups.map((g) => g.team));
    for (const team of teams) {
      expect(MOCK_RATINGS.has(team)).toBe(true);
    }
  });

  it('includes at least one undetermined ("TBD") knockout match', () => {
    expect(MOCK_BRACKET_DATA.matches.some((m) => m.homeTeam === 'TBD' || m.awayTeam === 'TBD')).toBe(
      true
    );
  });
});
