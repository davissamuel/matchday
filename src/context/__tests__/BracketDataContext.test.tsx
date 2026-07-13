jest.mock('../../domain/loadBracketData');
jest.mock('../../domain/loadTeamRatings');
jest.mock('../../config/env', () => ({
  getFootballDataApiKey: jest.fn(() => 'test-key'),
  shouldUseMockData: jest.fn(() => false),
}));

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { BracketDataProvider, useBracketDataContext } from '../BracketDataContext';
import { loadBracketData } from '../../domain/loadBracketData';
import { loadTeamRatings } from '../../domain/loadTeamRatings';
import { getFootballDataApiKey, shouldUseMockData } from '../../config/env';
import { MOCK_BRACKET_DATA, MOCK_RATINGS } from '../../domain/mockData';

function Consumer() {
  const { bracket, ratings, error } = useBracketDataContext();
  if (error) return <Text>{error}</Text>;
  if (!bracket || !ratings) return <Text>loading</Text>;
  return <Text>{`${bracket.groups.length}-${ratings.size}`}</Text>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('BracketDataProvider', () => {
  it('loads bracket data then ratings and exposes both to consumers', async () => {
    const bracketDeferred = deferred<{ groups: unknown[]; matches: unknown[] }>();
    (loadBracketData as jest.Mock).mockReturnValue(bracketDeferred.promise);
    (loadTeamRatings as jest.Mock).mockResolvedValue(
      new Map([['Argentina', { team: 'Argentina', rating: 1800, source: 'seed' }]])
    );

    const { getByText } = await render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    expect(getByText('loading')).toBeTruthy();

    bracketDeferred.resolve({
      groups: [{ groupName: 'GROUP_A', team: 'Argentina', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }],
      matches: [],
    });

    await waitFor(() => expect(getByText('1-1')).toBeTruthy());
  });

  it('exposes an error message when loading fails', async () => {
    (loadBracketData as jest.Mock).mockRejectedValue(new Error('network down'));

    const { getByText } = await render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    await waitFor(() => expect(getByText('network down')).toBeTruthy());
  });

  it('exposes an error message when getFootballDataApiKey throws synchronously', async () => {
    (getFootballDataApiKey as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Missing FOOTBALL_DATA_API_KEY. Set it in your environment.');
    });

    const { getByText } = await render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    await waitFor(() =>
      expect(getByText('Missing FOOTBALL_DATA_API_KEY. Set it in your environment.')).toBeTruthy()
    );
  });

  it('loads mock data instead of calling the real API when shouldUseMockData is true', async () => {
    (shouldUseMockData as jest.Mock).mockReturnValueOnce(true);

    const { getByText } = await render(
      <BracketDataProvider>
        <Consumer />
      </BracketDataProvider>
    );

    await waitFor(() =>
      expect(getByText(`${MOCK_BRACKET_DATA.groups.length}-${MOCK_RATINGS.size}`)).toBeTruthy()
    );
  });
});
