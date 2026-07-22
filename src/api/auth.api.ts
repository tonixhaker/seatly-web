import type { components } from './core.gen';
import { coreClient } from './core';
import { handling } from './middleware';

export type RegisterBody = components['schemas']['RegisterRequest'];
export type LoginBody = components['schemas']['LoginRequest'];

export async function register(body: RegisterBody) {
  const { data, error } = await coreClient.POST('/api/v1/auth/register', {
    body,
    middleware: handling('VALIDATION_FAILED'),
  });
  if (error) throw error;
  return data;
}

export async function login(body: LoginBody) {
  const { data, error } = await coreClient.POST('/api/v1/auth/login', {
    body,
    middleware: handling('VALIDATION_FAILED'),
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await coreClient.POST('/api/v1/auth/logout', {});
  if (error) throw error;
}

export async function getMe() {
  const { data, error } = await coreClient.GET('/api/v1/me', {});
  if (error) throw error;
  return data;
}
