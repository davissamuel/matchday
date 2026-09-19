import React from 'react';
import { render } from '@testing-library/react-native';
import { TeamLabel } from '../TeamLabel';

describe('TeamLabel', () => {
  it('renders the team name', async () => {
    const { getByText } = await render(<TeamLabel team="Arsenal FC" />);
    expect(getByText('Arsenal FC')).toBeTruthy();
  });
});
