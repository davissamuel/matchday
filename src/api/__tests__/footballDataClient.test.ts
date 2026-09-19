import {
  fetchCompetitionMatches,
  fetchCompetitionStandings,
  PREMIER_LEAGUE_CODE,
} from '../footballDataClient';

function fakeOkResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

describe('PREMIER_LEAGUE_CODE', () => {
  it('is the football-data.org Premier League competition code', () => {
    expect(PREMIER_LEAGUE_CODE).toBe('PL');
  });
});

describe('fetchCompetitionMatches', () => {
  it('requests the matches endpoint for the given competition code with the auth header', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ matches: [] }));
    await fetchCompetitionMatches(PREMIER_LEAGUE_CODE, {
      apiKey: 'test-key',
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/PL/matches',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
  });

  it('throws when the response is not ok', async () => {
    const fetchFn = jest.fn(() => Promise.resolve({ ok: false, status: 429 } as Response));
    await expect(
      fetchCompetitionMatches(PREMIER_LEAGUE_CODE, {
        apiKey: 'test-key',
        fetchFn: fetchFn as unknown as typeof fetch,
      })
    ).rejects.toThrow('429');
  });
});

describe('fetchCompetitionStandings', () => {
  it('requests the standings endpoint for the given competition code', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ standings: [] }));
    const result = await fetchCompetitionStandings(PREMIER_LEAGUE_CODE, {
      apiKey: 'test-key',
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/PL/standings',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
    expect(result).toEqual({ standings: [] });
  });
});
