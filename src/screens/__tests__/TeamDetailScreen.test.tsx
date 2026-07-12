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
});
