import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const USER = { id: 1, name: 'Ada', email: 'ada@example.test', role: 'buyer' };

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

async function load() {
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('window', { localStorage: local });
  vi.resetModules();
  return import('./auth.store');
}

function persisted() {
  return JSON.parse(session.getItem('seatly-auth') ?? '{}').state;
}

let session: Storage;
let local: Storage;

beforeEach(() => {
  session = memoryStorage();
  local = memoryStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authStore persistence', () => {
  it('writes the token and user to sessionStorage on login', async () => {
    const { useAuthStore } = await load();

    useAuthStore.getState().login('tok', USER);

    expect(persisted()).toEqual({ token: 'tok', user: USER });
  });

  it('leaves nothing under seatly-auth in localStorage, including a legacy entry', async () => {
    local.setItem(
      'seatly-auth',
      JSON.stringify({ state: { token: 'old', user: USER }, version: 0 }),
    );
    const { useAuthStore } = await load();

    expect(useAuthStore.getState().token).toBeNull();
    useAuthStore.getState().login('tok', USER);

    expect(local.getItem('seatly-auth')).toBeNull();
  });

  it('rehydrates the token from sessionStorage on reload', async () => {
    session.setItem(
      'seatly-auth',
      JSON.stringify({ state: { token: 'tok', user: USER }, version: 0 }),
    );
    const { useAuthStore } = await load();

    expect(useAuthStore.getState().token).toBe('tok');
    expect(useAuthStore.getState().user).toEqual(USER);
  });

  it('keeps no token in sessionStorage after logout', async () => {
    const { useAuthStore } = await load();

    useAuthStore.getState().login('tok', USER);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(persisted().token).toBeNull();
  });
});
