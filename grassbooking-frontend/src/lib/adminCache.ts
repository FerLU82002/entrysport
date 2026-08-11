const store: Record<string, unknown> = {};

export const adminCache = {
  get<T>(key: string): T | undefined {
    return store[key] as T | undefined;
  },
  set<T>(key: string, data: T): void {
    store[key] = data;
  },
  has(key: string): boolean {
    return key in store;
  },
  del(key: string): void {
    delete store[key];
  },
};
