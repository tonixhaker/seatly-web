import type { MiddlewareCallbackParams } from 'openapi-fetch';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware, handling } from './middleware';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

async function respond(id: string, middleware: ReturnType<typeof handling>) {
  const params = { id } as MiddlewareCallbackParams;
  for (const m of middleware) await m.onRequest?.(params);
  const response = new Response(
    JSON.stringify({ error: { code: 'seat_conflict', message: 'Taken' } }),
    { status: 409 },
  );
  await authMiddleware.onResponse?.({
    ...params,
    response,
    schemaPath: '/events/{id}/live-seats',
  } as MiddlewareCallbackParams & { response: Response });
}

beforeEach(() => vi.clearAllMocks());

describe('authMiddleware', () => {
  it("suppresses the error toast for any code under handling('*')", async () => {
    await respond('a', handling('*'));
    expect(toast.error).not.toHaveBeenCalled();

    await respond('b', []);
    expect(toast.error).toHaveBeenCalledWith('Taken');
  });
});
