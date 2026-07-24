import type { Middleware } from 'openapi-fetch';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

const GENERIC_MESSAGE = 'Something went wrong';
const SESSION_ENDPOINTS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
]);
const handledCodes = new Map<string, Set<string>>();

export function handling(...codes: string[]): Middleware[] {
  return [
    {
      onRequest({ id }) {
        handledCodes.set(id, new Set(codes));
      },
    },
  ];
}

export const authMiddleware: Middleware = {
  onRequest({ request }) {
    const { token } = useAuthStore.getState();
    if (token !== null) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    request.headers.set('X-Request-Id', crypto.randomUUID());
    return request;
  },
  async onResponse({ id, response, schemaPath }) {
    const handled = handledCodes.get(id);
    handledCodes.delete(id);
    if (response.ok) {
      return;
    }
    if (response.status === 401 && !SESSION_ENDPOINTS.has(schemaPath)) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign(
          `/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
      }
      return;
    }
    if (handled?.has('*')) {
      return;
    }
    const error = unwrapApiError(
      await response
        .clone()
        .json()
        .catch(() => null),
    );
    if (error !== null && handled?.has(error.code)) {
      return;
    }
    const useEnvelope =
      error !== null && (response.status < 500 || response.status === 503);
    toast.error(useEnvelope ? error.message : GENERIC_MESSAGE);
  },
  onError({ id }) {
    handledCodes.delete(id);
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
