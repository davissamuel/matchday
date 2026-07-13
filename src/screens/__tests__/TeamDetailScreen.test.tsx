jest.mock('../../context/BracketDataContext');
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { team: 'Argentina' } }),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import TeamDetailScreen from '../TeamDetailScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

describe('TeamDetailScreen', () => {
  it('shows a loading message when ratings are not yet available', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = await render(<TeamDetailScreen />);
    expect(getByTestId('team-rating').props.children).toBe('Loading rating…');
  });

  it('shows the team name and rounded rating once loaded', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: null,
      ratings: new Map([['Argentina', { team: 'Argentina', rating: 1834.6, source: 'seed' }]]),
      error: null,
    });
    const { getByText, getByTestId } = await render(<TeamDetailScreen />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByTestId('team-rating').props.children).toBe('Rating: 1835');
  });

  it('shows the error message when loading failed', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: 'network down' });
    const { getByTestId } = await render(<TeamDetailScreen />);
    expect(getByTestId('team-detail-error').props.children).toBe('network down');
  });

  it("lists the team's matches so far, formatted with scores or \"vs\" for undetermined opponents", async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({
      bracket: {
        groups: [],
        matches: [
          {
            id: 1,
            stage: 'GROUP_STAGE',
            utcDate: '2026-06-15T18:00:00Z',
            homeTeam: 'Argentina',
            awayTeam: 'Brazil',
            homeScore: 2,
            awayScore: 0,
            status: 'FINISHED',
          },
          {
            id: 2,
            stage: 'LAST_16',
            utcDate: '2026-07-01T18:00:00Z',
            homeTeam: 'Argentina',
            awayTeam: 'TBD',
            homeScore: null,
            awayScore: null,
            status: 'SCHEDULED',
          },
          {
            id: 3,
            stage: 'GROUP_STAGE',
            utcDate: '2026-06-10T18:00:00Z',
            homeTeam: 'France',
            awayTeam: 'Germany',
            homeScore: 1,
            awayScore: 1,
            status: 'FINISHED',
          },
        ],
      },
      ratings: new Map([['Argentina', { team: 'Argentina', rating: 1800, source: 'seed' }]]),
      error: null,
    });

    const { getByTestId, queryByTestId } = await render(<TeamDetailScreen />);

    expect(getByTestId('team-match-1').props.children).toBe('Argentina 2 - 0 Brazil');
    expect(getByTestId('team-match-2').props.children).toBe('Argentina vs TBD');
    expect(queryByTestId('team-match-3')).toBeNull();
  });
});
