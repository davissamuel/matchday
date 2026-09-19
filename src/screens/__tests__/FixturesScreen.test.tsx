jest.mock('../../context/LeagueDataContext');

import React from 'react';
import { render } from '@testing-library/react-native';
import FixturesScreen from '../FixturesScreen';
import { useLeagueDataContext } from '../../context/LeagueDataContext';

describe('FixturesScreen', () => {
  it('shows a loading indicator while data is null', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({ standings: null, matches: null, error: null });
    const { getByTestId } = await render(<FixturesScreen />);
    expect(getByTestId('fixtures-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: null,
      matches: null,
      error: 'network down',
    });
    const { getByTestId } = await render(<FixturesScreen />);
    expect(getByTestId('fixtures-error').props.children).toBe('network down');
  });

  it('renders results and upcoming fixtures in separate sections', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: [],
      matches: [
        {
          id: 1,
          utcDate: '2026-09-13T14:00:00Z',
          status: 'FINISHED',
          homeTeam: 'Liverpool FC',
          awayTeam: 'Arsenal FC',
          homeScore: 2,
          awayScore: 1,
        },
        {
          id: 2,
          utcDate: '2026-09-27T14:00:00Z',
          status: 'SCHEDULED',
          homeTeam: 'Chelsea FC',
          awayTeam: 'Aston Villa FC',
          homeScore: null,
          awayScore: null,
        },
      ],
      error: null,
    });

    const { getByText, getByTestId } = await render(<FixturesScreen />);

    expect(getByText('Results')).toBeTruthy();
    expect(getByTestId('fixture-match-1')).toBeTruthy();
    expect(getByText('2 - 1')).toBeTruthy();

    expect(getByText('Fixtures')).toBeTruthy();
    expect(getByTestId('fixture-match-2')).toBeTruthy();
    expect(getByText('vs')).toBeTruthy();
  });
});
