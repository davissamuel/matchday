jest.mock('../../context/BracketDataContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockNavigate = jest.fn();

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import BracketScreen from '../BracketScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

describe('BracketScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows a loading indicator while data is null', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = await render(<BracketScreen />);
    expect(getByTestId('bracket-loading')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = await render(<BracketScreen />);
    expect(getByTestId('bracket-error').props.children).toBe('network down');
  });

  it('renders group teams and navigates to TeamDetail on press', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [
          { groupName: 'GROUP_A', team: 'Argentina', played: 1, won: 1, draw: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3 },
        ],
        matches: [],
      },
      ratings: new Map(),
      error: null,
    });
    const { getByText } = await render(<BracketScreen />);
    fireEvent.press(getByText('Argentina — 3 pts'));
    expect(mockNavigate).toHaveBeenCalledWith('TeamDetail', { team: 'Argentina' });
  });

  it('renders knockout matches grouped by stage with scores or "vs" for undetermined slots', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [],
        matches: [
          {
            id: 1,
            stage: 'LAST_16',
            utcDate: '2026-07-01T18:00:00Z',
            homeTeam: 'Argentina',
            awayTeam: 'Brazil',
            homeScore: 2,
            awayScore: 1,
            status: 'FINISHED',
          },
          {
            id: 2,
            stage: 'QUARTER_FINALS',
            utcDate: '2026-07-05T18:00:00Z',
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            homeScore: null,
            awayScore: null,
            status: 'SCHEDULED',
          },
        ],
      },
      ratings: new Map(),
      error: null,
    });

    const { getByText, getByTestId } = await render(<BracketScreen />);

    expect(getByText('Round of 16')).toBeTruthy();
    expect(getByTestId('knockout-match-1').props.children).toBe('Argentina 2 - 1 Brazil');

    expect(getByText('Quarterfinals')).toBeTruthy();
    expect(getByTestId('knockout-match-2').props.children).toBe('TBD vs TBD');
  });
});
