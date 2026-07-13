import Constants from 'expo-constants';

export function getFootballDataApiKey(): string {
  const key = Constants.expoConfig?.extra?.footballDataApiKey;
  if (!key || typeof key !== 'string') {
    throw new Error(
      'Missing FOOTBALL_DATA_API_KEY. Copy .env.example to .env and set your football-data.org API key.'
    );
  }
  return key;
}

export function shouldUseMockData(): boolean {
  return Constants.expoConfig?.extra?.useMockData === true;
}
