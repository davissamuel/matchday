import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

const inFlight = new Map<string, Promise<unknown>>();

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

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const data = await fetcher();
      await storage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, fetchPromise);
  return fetchPromise;
}
