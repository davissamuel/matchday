import React from 'react';
import { render } from '@testing-library/react-native';
import { StatPill } from '../StatPill';

describe('StatPill', () => {
  it('renders the label and value', async () => {
    const { getByText } = await render(<StatPill label="Rating" value="1835" />);
    expect(getByText('Rating')).toBeTruthy();
    expect(getByText('1835')).toBeTruthy();
  });

  it('forwards a testID', async () => {
    const { getByTestId } = await render(<StatPill label="Rating" value="1835" testID="team-rating" />);
    expect(getByTestId('team-rating')).toBeTruthy();
  });
});
