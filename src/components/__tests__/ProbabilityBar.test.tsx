import React from 'react';
import { render } from '@testing-library/react-native';
import { ProbabilityBar } from '../ProbabilityBar';

describe('ProbabilityBar', () => {
  it('renders rounded percentages for each outcome', async () => {
    const { getByText } = await render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.554}
        drawProbability={0.201}
        lossProbability={0.245}
      />
    );
    expect(getByText('55%')).toBeTruthy();
    expect(getByText('20%')).toBeTruthy();
    expect(getByText('25%')).toBeTruthy();
  });

  it('renders both team names', async () => {
    const { getByText } = await render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.5}
        drawProbability={0.25}
        lossProbability={0.25}
      />
    );
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByText('Brazil')).toBeTruthy();
  });

  it('forwards a testID to the outer container', async () => {
    const { getByTestId } = await render(
      <ProbabilityBar
        homeTeam="Argentina"
        awayTeam="Brazil"
        winProbability={0.5}
        drawProbability={0.25}
        lossProbability={0.25}
        testID="probability-display"
      />
    );
    expect(getByTestId('probability-display')).toBeTruthy();
  });
});
