jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} as Record<string, unknown> } },
}));

import Constants from 'expo-constants';
import { getFootballDataApiKey } from '../env';

describe('getFootballDataApiKey', () => {
  afterEach(() => {
    (Constants as any).expoConfig.extra = {};
  });

  it('returns the configured API key', () => {
    (Constants as any).expoConfig.extra.footballDataApiKey = 'abc123';
    expect(getFootballDataApiKey()).toBe('abc123');
  });

  it('throws a descriptive error when the key is missing', () => {
    expect(() => getFootballDataApiKey()).toThrow(/FOOTBALL_DATA_API_KEY/);
  });

  it('throws when the key is not a string', () => {
    (Constants as any).expoConfig.extra.footballDataApiKey = 12345;
    expect(() => getFootballDataApiKey()).toThrow(/FOOTBALL_DATA_API_KEY/);
  });
});
