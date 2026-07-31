import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.hoisted(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://api.test');
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
});

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const { createEvent, updateEvent, publishEvent } =
  await import('./organizer.api');

const body = { venue_id: 1, title: 'Gala', starts_at: '2026-10-01T19:00:00Z' };

function reply(status: number, code: string) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { code, message: code } }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => vi.clearAllMocks());

describe('createEvent', () => {
  it('rejects VALIDATION_FAILED with the envelope and no toast', async () => {
    reply(422, 'VALIDATION_FAILED');
    await expect(createEvent(body)).rejects.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('updateEvent', () => {
  it('rejects VALIDATION_FAILED with the envelope and no toast', async () => {
    reply(422, 'VALIDATION_FAILED');
    await expect(updateEvent({ id: 7, body })).rejects.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('publishEvent', () => {
  it('toasts the envelope message on INVALID_STATE_TRANSITION', async () => {
    reply(409, 'INVALID_STATE_TRANSITION');
    await expect(publishEvent(7)).rejects.toMatchObject({
      error: { code: 'INVALID_STATE_TRANSITION' },
    });
    expect(toast.error).toHaveBeenCalledWith('INVALID_STATE_TRANSITION');
  });
});
