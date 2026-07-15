import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchCard } from '../MatchCard';
import { BracketMatch } from '../../domain/bracket';

function buildMatch(overrides: Partial<BracketMatch>): BracketMatch {
  return {
    id: 1,
    stage: 'LAST_16',
    utcDate: '2026-07-01T18:00:00Z',
    homeTeam: 'Argentina',
    awayTeam: 'Brazil',
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    ...overrides,
  };
}

describe('MatchCard', () => {
  it('renders both team names', async () => {
    const { getByText } = await render(<MatchCard match={buildMatch({})} />);
    expect(getByText('Argentina')).toBeTruthy();
    expect(getByText('Brazil')).toBeTruthy();
  });

  it('renders the score when the match is decided', async () => {
    const { getByText } = await render(<MatchCard match={buildMatch({ homeScore: 2, awayScore: 1 })} />);
    expect(getByText('2 - 1')).toBeTruthy();
  });

  it('renders "vs" when the match has no score yet', async () => {
    const { getByText } = await render(<MatchCard match={buildMatch({})} />);
    expect(getByText('vs')).toBeTruthy();
  });

  it('forwards a testID to the outer container', async () => {
    const { getByTestId } = await render(<MatchCard match={buildMatch({})} testID="knockout-match-1" />);
    expect(getByTestId('knockout-match-1')).toBeTruthy();
  });
});
