jest.mock('../../domain/loadLeagueData');
jest.mock('../../config/env', () => ({
  getFootballDataApiKey: jest.fn(() => 'test-key'),
  shouldUseMockData: jest.fn(() => false),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { LeagueDataProvider, useLeagueDataContext } from '../LeagueDataContext';
import { loadLeagueData } from '../../domain/loadLeagueData';
import { getFootballDataApiKey, shouldUseMockData } from '../../config/env';
import { MOCK_LEAGUE_DATA } from '../../domain/mockData';

function Consumer() {
  const { standings, matches, error } = useLeagueDataContext();
  if (error) return <Text>{error}</Text>;
  if (!standings || !matches) return <Text>loading</Text>;
  return <Text>{`${standings.length}-${matches.length}`}</Text>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('LeagueDataProvider', () => {
  it('loads league data and exposes standings and matches to consumers', async () => {
    const leagueDeferred = deferred<{ standings: unknown[]; matches: unknown[] }>();
    (loadLeagueData as jest.Mock).mockReturnValue(leagueDeferred.promise);

    const { getByText } = await render(
      <LeagueDataProvider>
        <Consumer />
      </LeagueDataProvider>
    );

    expect(getByText('loading')).toBeTruthy();

    leagueDeferred.resolve({ standings: [{ team: 'Liverpool FC' }], matches: [] });

    await waitFor(() => expect(getByText('1-0')).toBeTruthy());
  });

  it('exposes an error message when loading fails', async () => {
    (loadLeagueData as jest.Mock).mockRejectedValue(new Error('network down'));

    const { getByText } = await render(
      <LeagueDataProvider>
        <Consumer />
      </LeagueDataProvider>
    );

    await waitFor(() => expect(getByText('network down')).toBeTruthy());
  });

  it('exposes an error message when getFootballDataApiKey throws synchronously', async () => {
    (getFootballDataApiKey as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Missing FOOTBALL_DATA_API_KEY. Set it in your environment.');
    });

    const { getByText } = await render(
      <LeagueDataProvider>
        <Consumer />
      </LeagueDataProvider>
    );

    await waitFor(() =>
      expect(getByText('Missing FOOTBALL_DATA_API_KEY. Set it in your environment.')).toBeTruthy()
    );
  });

  it('loads mock data instead of calling the real API when shouldUseMockData is true', async () => {
    (shouldUseMockData as jest.Mock).mockReturnValueOnce(true);

    const { getByText } = await render(
      <LeagueDataProvider>
        <Consumer />
      </LeagueDataProvider>
    );

    await waitFor(() =>
      expect(
        getByText(`${MOCK_LEAGUE_DATA.standings.length}-${MOCK_LEAGUE_DATA.matches.length}`)
      ).toBeTruthy()
    );
  });
});
