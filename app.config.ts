import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'matchday',
  slug: 'matchday',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  extra: {
    footballDataApiKey: process.env.FOOTBALL_DATA_API_KEY,
    useMockData: process.env.USE_MOCK_DATA === 'true',
  },
};

export default config;
