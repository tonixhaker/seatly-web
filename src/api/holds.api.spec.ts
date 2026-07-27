import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => {
  vi.stubEnv('VITE_REALTIME_BASE_URL', 'http://realtime.test');
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
});

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const { holdSeats, releaseSeats } = await import('./holds.api');

const body = { event_id: 1, seat_ids: [4], session_id: 's-1' };

function reply(status: number, code: string) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { code, message: code } }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => vi.clearAllMocks());

describe('holdSeats', () => {
  it('rejects a SEATS_CONFLICT without the generic toast but toasts other errors', async () => {
    reply(409, 'SEATS_CONFLICT');
    await expect(holdSeats(body)).rejects.toMatchObject({
      error: { code: 'SEATS_CONFLICT' },
    });
    expect(toast.error).not.toHaveBeenCalled();

    reply(400, 'VALIDATION_FAILED');
    await expect(holdSeats(body)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('VALIDATION_FAILED');
  });
});

describe('releaseSeats', () => {
  it('stays quiet on any error only when silent', async () => {
    reply(503, 'UNAVAILABLE');
    await expect(releaseSeats(body, true)).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();

    reply(503, 'UNAVAILABLE');
    await expect(releaseSeats(body)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('UNAVAILABLE');
  });
});
