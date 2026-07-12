import { fetchWorldCupMatches, fetchWorldCupStandings } from '../footballDataClient';

function fakeOkResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

describe('fetchWorldCupMatches', () => {
  it('requests the WC matches endpoint with the auth header', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ matches: [] }));
    await fetchWorldCupMatches({ apiKey: 'test-key', fetchFn: fetchFn as unknown as typeof fetch });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
  });

  it('throws when the response is not ok', async () => {
    const fetchFn = jest.fn(() =>
      Promise.resolve({ ok: false, status: 429 } as Response)
    );
    await expect(
      fetchWorldCupMatches({ apiKey: 'test-key', fetchFn: fetchFn as unknown as typeof fetch })
    ).rejects.toThrow('429');
  });
});

describe('fetchWorldCupStandings', () => {
  it('requests the WC standings endpoint', async () => {
    const fetchFn = jest.fn(() => fakeOkResponse({ standings: [] }));
    const result = await fetchWorldCupStandings({
      apiKey: 'test-key',
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.football-data.org/v4/competitions/WC/standings',
      { headers: { 'X-Auth-Token': 'test-key' } }
    );
    expect(result).toEqual({ standings: [] });
  });
});
