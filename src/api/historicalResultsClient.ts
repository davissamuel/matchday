import Papa from 'papaparse';
import { HistoricalMatch } from '../domain/types';
import { normalizeTeamName } from '../domain/teamNameAliases';

export type CsvFetchFn = (
  url: string
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

const DEFAULT_CSV_URL =
  'https://raw.githubusercontent.com/martj42/international_results/master/results.csv';

export async function fetchHistoricalMatches(
  sinceYear: number,
  fetchFn: CsvFetchFn = fetch as unknown as CsvFetchFn,
  csvUrl: string = DEFAULT_CSV_URL
): Promise<HistoricalMatch[]> {
  const response = await fetchFn(csvUrl);
  if (!response.ok) {
    throw new Error(`historical results request failed: ${response.status}`);
  }
  const csvText = await response.text();
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const matches: HistoricalMatch[] = [];
  for (const row of parsed.data) {
    const year = Number(row.date?.slice(0, 4));
    const homeScore = Number(row.home_score);
    const awayScore = Number(row.away_score);
    if (!year || year < sinceYear || Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
      continue;
    }
    matches.push({
      date: row.date,
      homeTeam: normalizeTeamName(row.home_team),
      awayTeam: normalizeTeamName(row.away_team),
      homeScore,
      awayScore,
    });
  }
  return matches;
}
