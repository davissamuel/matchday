import { MOCK_LEAGUE_DATA } from '../mockData';

describe('mockData', () => {
  it('provides at least one standings row', () => {
    expect(MOCK_LEAGUE_DATA.standings.length).toBeGreaterThan(0);
  });

  it('standings are sorted by position ascending', () => {
    const positions = MOCK_LEAGUE_DATA.standings.map((s) => s.position);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('provides both a finished result and an upcoming fixture', () => {
    expect(MOCK_LEAGUE_DATA.matches.some((m) => m.status === 'FINISHED')).toBe(true);
    expect(MOCK_LEAGUE_DATA.matches.some((m) => m.status !== 'FINISHED')).toBe(true);
  });

  it('every match team also appears in the standings', () => {
    const teams = new Set(MOCK_LEAGUE_DATA.standings.map((s) => s.team));
    for (const match of MOCK_LEAGUE_DATA.matches) {
      expect(teams.has(match.homeTeam)).toBe(true);
      expect(teams.has(match.awayTeam)).toBe(true);
    }
  });
});
