import type { Middleware } from 'openapi-fetch';

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

let bearerToken: string | null = null;

export function setBearerToken(token: string | null): void {
  bearerToken = token;
}

export const authMiddleware: Middleware = {
  onRequest({ request }) {
    if (bearerToken !== null) {
      request.headers.set('Authorization', `Bearer ${bearerToken}`);
    }
    return request;
  },
};

export function unwrapApiError(body: unknown): ApiError | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return null;
  }
  const inner = (body as { error: unknown }).error;
  if (typeof inner !== 'object' || inner === null) {
    return null;
  }
  const { code, message, details } = inner as Partial<ApiError>;
  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }
  return details === undefined ? { code, message } : { code, message, details };
}
