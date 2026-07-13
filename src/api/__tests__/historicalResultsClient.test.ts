import { fetchHistoricalMatches } from '../historicalResultsClient';

const FIXTURE_CSV = `date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
1990-06-08,Argentina,Cameroon,0,1,FIFA World Cup,Milan,Italy,TRUE
2018-06-16,Argentina,Iceland,1,1,FIFA World Cup,Moscow,Russia,TRUE
2022-11-22,Argentina,Saudi Arabia,1,2,FIFA World Cup,Lusail,Qatar,TRUE
`;

function fakeFetch(): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(FIXTURE_CSV) });
}

describe('fetchHistoricalMatches', () => {
  it('parses CSV rows into HistoricalMatch objects', async () => {
    const matches = await fetchHistoricalMatches(1900, fakeFetch);
    expect(matches).toHaveLength(3);
    expect(matches[0]).toEqual({
      date: '1990-06-08',
      homeTeam: 'Argentina',
      awayTeam: 'Cameroon',
      homeScore: 0,
      awayScore: 1,
    });
  });

  it('filters out matches before the given year', async () => {
    const matches = await fetchHistoricalMatches(2020, fakeFetch);
    expect(matches).toHaveLength(1);
    expect(matches[0].date).toBe('2022-11-22');
  });

  it('throws when the response is not ok', async () => {
    const failingFetch = () =>
      Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });
    await expect(fetchHistoricalMatches(1900, failingFetch)).rejects.toThrow();
  });

  it('normalizes aliased team names from the CSV', async () => {
    const aliasedCsv = `date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
2018-06-16,Korea Republic,Argentina,1,1,FIFA World Cup,Moscow,Russia,TRUE
`;
    const aliasedFetch = () =>
      Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(aliasedCsv) });
    const matches = await fetchHistoricalMatches(1900, aliasedFetch);
    expect(matches[0].homeTeam).toBe('South Korea');
  });
});
