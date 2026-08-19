import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const T = 1_700_000_000_000;

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

async function load(storage: Storage) {
  vi.stubGlobal('sessionStorage', storage);
  vi.resetModules();
  return import('./cart.store');
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cartStore session id', () => {
  it('is a UUID persisted under seatly-cart and reused across reloads', async () => {
    const first = await load(storage);
    const id = first.useCartStore.getState().sessionId;

    expect(id).toMatch(UUID);
    expect(
      JSON.parse(storage.getItem('seatly-cart') ?? '{}').state.sessionId,
    ).toBe(id);

    const reloaded = await load(storage);
    expect(reloaded.useCartStore.getState().sessionId).toBe(id);

    const otherTab = await load(memoryStorage());
    expect(otherTab.useCartStore.getState().sessionId).toMatch(UUID);
    expect(otherTab.useCartStore.getState().sessionId).not.toBe(id);
  });
});

describe('cartStore resetSession', () => {
  it('rotates the session id and empties the cart while clear keeps the id', async () => {
    const { useCartStore } = await load(storage);
    const cart = () => useCartStore.getState();
    const persisted = () =>
      JSON.parse(storage.getItem('seatly-cart') ?? '{}').state;
    const before = cart().sessionId;

    cart().addSeat(1, 10, T);
    cart().clear();
    expect(cart().sessionId).toBe(before);
    expect(persisted().sessionId).toBe(before);

    cart().addSeat(1, 10, T);
    cart().tick(T + 600_000);
    cart().addSeat(1, 11, T + 600_000);
    expect(cart().expired).toBe(true);
    expect(cart().seatIds).toEqual([11]);

    cart().resetSession();

    expect(cart().sessionId).toMatch(UUID);
    expect(cart().sessionId).not.toBe(before);
    expect(cart().seatIds).toEqual([]);
    expect(cart().eventId).toBeNull();
    expect(cart().expiresAt).toBeNull();
    expect(cart().expired).toBe(false);
    expect(persisted().sessionId).toBe(cart().sessionId);
  });
});

describe('cartStore seats', () => {
  it('ignores duplicates, keeps expiresAt while seats remain, clears it when empty', async () => {
    const { useCartStore } = await load(storage);
    const cart = () => useCartStore.getState();

    cart().addSeat(1, 10, T);
    cart().addSeat(1, 11, T + 1_000);
    cart().addSeat(1, 10, T + 2_000);
    expect(cart().seatIds).toEqual([10, 11]);

    cart().removeSeat(10);
    expect(cart().seatIds).toEqual([11]);
    expect(cart().expiresAt).toBe(T + 600_000);

    cart().removeSeat(11);
    expect(cart().seatIds).toEqual([]);
    expect(cart().expiresAt).toBeNull();
    expect(cart().eventId).toBeNull();
  });

  it('replaces the cart when a seat of another event is added', async () => {
    const { useCartStore } = await load(storage);
    const cart = () => useCartStore.getState();

    cart().addSeat(1, 10, T);
    cart().addSeat(1, 11, T);
    cart().addSeat(2, 20, T + 30_000);

    expect(cart().eventId).toBe(2);
    expect(cart().seatIds).toEqual([20]);
    expect(cart().expiresAt).toBe(T + 30_000 + 600_000);
  });
});

describe('cartStore countdown', () => {
  it('starts at 10:00 from the first seat and a second seat does not reset it', async () => {
    const { useCartStore, formatRemaining } = await load(storage);
    const cart = () => useCartStore.getState();

    cart().addSeat(1, 10, T);
    const expiresAt = cart().expiresAt ?? 0;
    expect(expiresAt).toBe(T + 600_000);
    expect(formatRemaining(expiresAt, T)).toBe('10:00');

    cart().addSeat(1, 11, T + 5_000);
    expect(cart().expiresAt).toBe(expiresAt);
    expect(formatRemaining(expiresAt, T + 5_000)).toBe('09:55');
  });

  it('clears the cart and flags expiry at 00:00, and ackExpired resets the flag', async () => {
    const { useCartStore, formatRemaining } = await load(storage);
    const cart = () => useCartStore.getState();
    const sessionId = cart().sessionId;

    cart().addSeat(1, 10, T);
    cart().addSeat(1, 11, T);
    const expiresAt = cart().expiresAt ?? 0;

    cart().tick(expiresAt - 1);
    expect(cart().seatIds).toEqual([10, 11]);
    expect(cart().expiresAt).toBe(expiresAt);
    expect(cart().expired).toBe(false);

    cart().tick(expiresAt);
    expect(cart().seatIds).toEqual([]);
    expect(cart().expiresAt).toBeNull();
    expect(cart().expired).toBe(true);
    expect(cart().sessionId).toBe(sessionId);
    expect(formatRemaining(expiresAt, expiresAt)).toBe('00:00');

    cart().ackExpired();
    expect(cart().expired).toBe(false);
  });
});
