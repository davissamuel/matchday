jest.mock('../../context/BracketDataContext');

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SimulationScreen from '../SimulationScreen';
import { useBracketDataContext } from '../../context/BracketDataContext';

function mockContext() {
  (useBracketDataContext as jest.Mock).mockReturnValue({
    bracket: {
      groups: [
        { groupName: 'GROUP_A', team: 'Argentina', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
        { groupName: 'GROUP_A', team: 'Brazil', played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
      ],
      matches: [],
    },
    ratings: new Map([
      ['Argentina', { team: 'Argentina', rating: 2000, source: 'seed' }],
      ['Brazil', { team: 'Brazil', rating: 1600, source: 'seed' }],
    ]),
    error: null,
  });
}

describe('SimulationScreen', () => {
  it('shows a loading message before bracket data is available', async () => {
    (useBracketDataContext as jest.Mock).mockReturnValue({ bracket: null, ratings: null, error: null });
    const { getByTestId } = await render(<SimulationScreen />);
    expect(getByTestId('simulation-loading')).toBeTruthy();
  });

  it('shows a probability breakdown once two teams are selected', async () => {
    mockContext();
    const { getByTestId } = await render(<SimulationScreen />);
    await fireEvent.press(getByTestId('team-a-Argentina'));
    await fireEvent.press(getByTestId('team-b-Brazil'));
    expect(getByTestId('probability-display')).toBeTruthy();
  });

  it('shows a simulated result after pressing Simulate', async () => {
    mockContext();
    const { getByTestId } = await render(<SimulationScreen />);
    await fireEvent.press(getByTestId('team-a-Argentina'));
    await fireEvent.press(getByTestId('team-b-Brazil'));
    await fireEvent.press(getByTestId('simulate-button'));
    expect(getByTestId('simulation-result')).toBeTruthy();
  });
});
