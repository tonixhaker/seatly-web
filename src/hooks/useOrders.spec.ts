import {
  MutationObserver,
  QueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaceOrderInput } from './useOrders';

const { placeOrder, captured } = vi.hoisted(() => ({
  placeOrder: vi.fn(),
  captured: { options: undefined as unknown },
}));

vi.mock('@/api/orders.api', () => ({ placeOrder }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => new QueryClient(),
  useMutation: (options: unknown) => {
    captured.options = options;
  },
}));

const { usePlaceOrder: placeOrderOptions } = await import('./useOrders');

const paid = {
  id: 9,
  event_id: 1,
  status: 'paid',
  total_cents: 100,
  currency: 'USD',
  items: [],
};

function observer() {
  placeOrderOptions();
  const client = new QueryClient({
    defaultOptions: { mutations: { retryDelay: 0 } },
  });
  return new MutationObserver(
    client,
    captured.options as UseMutationOptions<unknown, unknown, PlaceOrderInput>,
  );
}

const keysSent = () =>
  placeOrder.mock.calls.map(([body]) => body.idempotency_key);

beforeEach(() => vi.clearAllMocks());

describe('usePlaceOrder', () => {
  it('retries a network failure with the same idempotency key, and a new pay uses the new key', async () => {
    placeOrder
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(paid);
    const pay = observer();

    await pay.mutate({ eventId: 1, seatIds: [4], idempotencyKey: 'click-1' });
    await pay.mutate({ eventId: 1, seatIds: [4], idempotencyKey: 'click-2' });

    expect(keysSent()).toEqual(['click-1', 'click-1', 'click-2']);
  });

  it('does not retry a declined payment, so the failed order is not replayed', async () => {
    placeOrder.mockRejectedValue({
      error: { code: 'PAYMENT_DECLINED', message: 'declined' },
    });
    const pay = observer();

    await expect(
      pay.mutate({ eventId: 1, seatIds: [4], idempotencyKey: 'click-1' }),
    ).rejects.toMatchObject({ error: { code: 'PAYMENT_DECLINED' } });

    expect(keysSent()).toEqual(['click-1']);
  });
});
