import { getCached } from '../cache';

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
  };
}

describe('getCached', () => {
  it('calls the fetcher and caches the result on a cache miss', async () => {
    const storage = fakeStorage();
    const fetcher = jest.fn(() => Promise.resolve({ value: 42 }));
    const result = await getCached('key', 60000, fetcher, storage);
    expect(result).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('returns the cached value without calling the fetcher when still fresh', async () => {
    const storage = fakeStorage();
    const fetcher = jest.fn(() => Promise.resolve({ value: 1 }));
    await getCached('key', 60000, fetcher, storage);
    const result = await getCached('key', 60000, fetcher, storage);
    expect(result).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refetches when the cached value has expired', async () => {
    const storage = fakeStorage();
    let call = 0;
    const fetcher = jest.fn(() => Promise.resolve({ value: ++call }));
    await getCached('key', 0, fetcher, storage);
    const result = await getCached('key', 0, fetcher, storage);
    expect(result).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
