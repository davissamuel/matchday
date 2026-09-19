jest.mock('../../context/LeagueDataContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockNavigate = jest.fn();

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import StandingsScreen from '../StandingsScreen';
import { useLeagueDataContext } from '../../context/LeagueDataContext';

describe('StandingsScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows a loading indicator while data is null', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({ standings: null, matches: null, error: null });
    const { getByTestId } = await render(<StandingsScreen />);
    expect(getByTestId('standings-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: null,
      matches: null,
      error: 'network down',
    });
    const { getByTestId } = await render(<StandingsScreen />);
    expect(getByTestId('standings-error').props.children).toBe('network down');
  });

  it('renders standings rows in position order and navigates to TeamDetail on press', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: [
        { position: 1, team: 'Liverpool FC', played: 5, won: 4, draw: 1, lost: 0, goalsFor: 11, goalsAgainst: 3, goalDifference: 8, points: 13 },
        { position: 2, team: 'Arsenal FC', played: 5, won: 4, draw: 0, lost: 1, goalsFor: 9, goalsAgainst: 4, goalDifference: 5, points: 12 },
      ],
      matches: [],
      error: null,
    });
    const { getByText, getByTestId } = await render(<StandingsScreen />);
    expect(getByText('Liverpool FC')).toBeTruthy();
    expect(getByText('Arsenal FC')).toBeTruthy();
    expect(getByText('13')).toBeTruthy();
    fireEvent.press(getByTestId('standings-row-Liverpool FC'));
    expect(mockNavigate).toHaveBeenCalledWith('TeamDetail', { team: 'Liverpool FC' });
  });
});
