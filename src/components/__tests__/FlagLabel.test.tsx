import React from 'react';
import { render } from '@testing-library/react-native';
import { FlagLabel } from '../FlagLabel';

describe('FlagLabel', () => {
  it('renders the flag and team name for a known team', async () => {
    const { getByText } = await render(<FlagLabel team="Argentina" />);
    expect(getByText('🇦🇷')).toBeTruthy();
    expect(getByText('Argentina')).toBeTruthy();
  });

  it('renders just the team name when there is no flag (e.g. TBD)', async () => {
    const { getByText, queryByText } = await render(<FlagLabel team="TBD" />);
    expect(getByText('TBD')).toBeTruthy();
    expect(queryByText('🏳️')).toBeNull();
  });
});
