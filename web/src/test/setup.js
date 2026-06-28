import '@testing-library/jest-dom/vitest';

const store = new Map();

const localStorageMock = {
  get length() {
    return store.size;
  },
  key(index) {
    return [...store.keys()][index] ?? null;
  },
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  removeItem(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  store.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-26T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

export { store as mockLocalStorageStore };
