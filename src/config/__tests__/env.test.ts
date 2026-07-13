jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} as Record<string, unknown> } },
}));

import Constants from 'expo-constants';
import { getFootballDataApiKey, shouldUseMockData } from '../env';

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

describe('shouldUseMockData', () => {
  afterEach(() => {
    (Constants as any).expoConfig.extra = {};
  });

  it('returns false when useMockData is not set', () => {
    expect(shouldUseMockData()).toBe(false);
  });

  it('returns true when useMockData is set to true', () => {
    (Constants as any).expoConfig.extra.useMockData = true;
    expect(shouldUseMockData()).toBe(true);
  });

  it('returns false when useMockData is set to false', () => {
    (Constants as any).expoConfig.extra.useMockData = false;
    expect(shouldUseMockData()).toBe(false);
  });
});
