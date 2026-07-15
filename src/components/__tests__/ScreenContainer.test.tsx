import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenContainer } from '../ScreenContainer';

describe('ScreenContainer', () => {
  it('renders its children', async () => {
    const { getByText } = await render(
      <ScreenContainer>
        <Text>Hello</Text>
      </ScreenContainer>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('forwards a testID to the outer container', async () => {
    const { getByTestId } = await render(
      <ScreenContainer testID="my-screen">
        <Text>Hello</Text>
      </ScreenContainer>
    );
    expect(getByTestId('my-screen')).toBeTruthy();
  });
});
