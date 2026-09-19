jest.mock('../../context/LeagueDataContext');
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { team: 'Liverpool FC' } }),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import TeamDetailScreen from '../TeamDetailScreen';
import { useLeagueDataContext } from '../../context/LeagueDataContext';

describe('TeamDetailScreen', () => {
  it('shows a loading message when standings are not yet available', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({ standings: null, matches: null, error: null });
    const { getByText } = await render(<TeamDetailScreen />);
    expect(getByText('Loading standings…')).toBeTruthy();
  });

  it('shows the team name and league position once loaded', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: [
        { position: 1, team: 'Liverpool FC', played: 5, won: 4, draw: 1, lost: 0, goalsFor: 11, goalsAgainst: 3, goalDifference: 8, points: 13 },
      ],
      matches: [],
      error: null,
    });
    const { getByText, getByTestId } = await render(<TeamDetailScreen />);
    expect(getByText('Liverpool FC')).toBeTruthy();
    expect(getByTestId('team-position')).toBeTruthy();
    expect(getByText('#1')).toBeTruthy();
  });

  it('shows the error message when loading failed', async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({ standings: null, matches: null, error: 'network down' });
    const { getByTestId } = await render(<TeamDetailScreen />);
    expect(getByTestId('team-detail-error').props.children).toBe('network down');
  });

  it("lists only the team's own matches, with scores or \"vs\" for unplayed ones", async () => {
    (useLeagueDataContext as jest.Mock).mockReturnValue({
      standings: [
        { position: 1, team: 'Liverpool FC', played: 5, won: 4, draw: 1, lost: 0, goalsFor: 11, goalsAgainst: 3, goalDifference: 8, points: 13 },
      ],
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
          homeTeam: 'Aston Villa FC',
          awayTeam: 'Liverpool FC',
          homeScore: null,
          awayScore: null,
        },
        {
          id: 3,
          utcDate: '2026-09-14T14:00:00Z',
          status: 'FINISHED',
          homeTeam: 'Chelsea FC',
          awayTeam: 'Manchester City FC',
          homeScore: 1,
          awayScore: 1,
        },
      ],
      error: null,
    });

    const { getByTestId, queryByTestId } = await render(<TeamDetailScreen />);

    expect(getByTestId('team-match-1')).toBeTruthy();
    expect(getByTestId('team-match-2')).toBeTruthy();
    expect(queryByTestId('team-match-3')).toBeNull();
  });
});
