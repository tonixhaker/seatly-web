import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
});

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const { placeOrder } = await import('./orders.api');

const body = {
  event_id: 1,
  seat_ids: [4],
  session_id: '11111111-2222-4333-8444-555555555555',
  idempotency_key: 'k-1',
};

function reply(status: number, code: string) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { code, message: code } }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => vi.clearAllMocks());

describe('placeOrder', () => {
  it('leaves declines and expired holds to the page but toasts an unavailable service', async () => {
    reply(402, 'PAYMENT_DECLINED');
    await expect(placeOrder(body)).rejects.toMatchObject({
      error: { code: 'PAYMENT_DECLINED' },
    });
    reply(422, 'SEATS_NOT_HELD');
    await expect(placeOrder(body)).rejects.toMatchObject({
      error: { code: 'SEATS_NOT_HELD' },
    });
    expect(toast.error).not.toHaveBeenCalled();

    reply(503, 'SERVICE_UNAVAILABLE');
    await expect(placeOrder(body)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('SERVICE_UNAVAILABLE');
  });

  it('rejects a network failure as an Error and an HTTP error as the plain envelope', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(placeOrder(body)).rejects.toBeInstanceOf(Error);

    reply(402, 'PAYMENT_DECLINED');
    const declined = await placeOrder(body).catch((error: unknown) => error);
    expect(declined).not.toBeInstanceOf(Error);
  });
});
