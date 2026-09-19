import React from 'react';
import { render } from '@testing-library/react-native';
import { MatchCard } from '../MatchCard';
import { LeagueMatch } from '../../domain/league';

function buildMatch(overrides: Partial<LeagueMatch>): LeagueMatch {
  return {
    id: 1,
    utcDate: '2026-09-27T14:00:00Z',
    status: 'SCHEDULED',
    homeTeam: 'Arsenal FC',
    awayTeam: 'Chelsea FC',
    homeScore: null,
    awayScore: null,
    ...overrides,
  };
}

describe('MatchCard', () => {
  it('renders both team names', async () => {
    const { getByText } = await render(<MatchCard match={buildMatch({})} />);
    expect(getByText('Arsenal FC')).toBeTruthy();
    expect(getByText('Chelsea FC')).toBeTruthy();
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
    const { getByTestId } = await render(<MatchCard match={buildMatch({})} testID="fixture-1" />);
    expect(getByTestId('fixture-1')).toBeTruthy();
  });
});
