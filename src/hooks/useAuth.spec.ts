import {
  MutationObserver,
  QueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMock, captured } = vi.hoisted(() => {
  const data = new Map<string, string>();
  const storage: Storage = {
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
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('localStorage', storage);
  vi.stubEnv('VITE_REALTIME_BASE_URL', 'http://realtime.test');
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 204 }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, captured: { options: undefined as unknown } };
});

vi.mock('@/api/auth.api', () => ({ login: vi.fn(), logout: vi.fn() }));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => new QueryClient(),
  useMutation: (options: unknown) => {
    captured.options = options;
  },
}));

const authApi = await import('@/api/auth.api');
const { useLogin, useLogout } = await import('./useAuth');
const { useReleaseSeat } = await import('./useHolds');
const { useCartStore } = await import('@/stores/cart.store');

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function observe<TVariables>(hook: () => unknown) {
  hook();
  return new MutationObserver(
    new QueryClient(),
    captured.options as UseMutationOptions<unknown, unknown, TVariables>,
  );
}

const persisted = () =>
  JSON.parse(sessionStorage.getItem('seatly-cart') ?? '{}').state;

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.getState().addSeat(1, 4, Date.now());
});

describe('useLogout', () => {
  it('rotates the persisted session id and empties the cart when logout succeeds', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    const before = persisted().sessionId;
    expect(persisted().seatIds).toEqual([4]);

    await observe<void>(useLogout).mutate();

    expect(persisted().sessionId).toMatch(UUID);
    expect(persisted().sessionId).not.toBe(before);
    expect(persisted().seatIds).toEqual([]);
    expect(persisted().eventId).toBeNull();
  });

  it('rotates the persisted session id and empties the cart when logout fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    const before = persisted().sessionId;
    expect(persisted().seatIds).toEqual([4]);

    await expect(observe<void>(useLogout).mutate()).rejects.toThrow(
      'Failed to fetch',
    );

    expect(persisted().sessionId).toMatch(UUID);
    expect(persisted().sessionId).not.toBe(before);
    expect(persisted().seatIds).toEqual([]);
    expect(persisted().eventId).toBeNull();
  });

  it('makes a later seat release send the new session id', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    const before = persisted().sessionId;

    await observe<void>(useLogout).mutate();
    await observe<{ eventId: number; seatIds: number[] }>(
      useReleaseSeat,
    ).mutate({ eventId: 1, seatIds: [4] });

    const request = fetchMock.mock.calls.at(-1)?.[0] as Request;
    expect(request.method).toBe('DELETE');
    expect(request.url).toMatch(/\/holds$/);
    const body = await request.json();
    expect(body.session_id).toBe(persisted().sessionId);
    expect(body.session_id).not.toBe(before);
  });
});

describe('useLogin', () => {
  it('keeps the persisted session id after a successful login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 't-1',
      user: { id: 1, name: 'Ann', email: 'ann@example.com', role: 'buyer' },
    } as Awaited<ReturnType<typeof authApi.login>>);
    const before = persisted().sessionId;

    await observe<{ email: string; password: string }>(useLogin).mutate({
      email: 'ann@example.com',
      password: 'secret',
    });

    expect(authApi.login).toHaveBeenCalled();
    expect(persisted().sessionId).toBe(before);
  });
});
