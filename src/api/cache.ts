import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  storage: Storage = AsyncStorage
): Promise<T> {
  const raw = await storage.getItem(key);
  if (raw) {
    const parsed: CacheEnvelope<T> = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < ttlMs) {
      return parsed.data;
    }
  }
  const data = await fetcher();
  await storage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  return data;
}
