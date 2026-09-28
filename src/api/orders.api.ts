import type { components } from './core.gen';
import { coreClient } from './core';
import { handling } from './middleware';

export type PlaceOrderBody = components['schemas']['PlaceOrderRequest'];

export async function placeOrder(body: PlaceOrderBody) {
  const { data, error } = await coreClient.POST('/api/v1/orders', {
    body,
    middleware: handling('PAYMENT_DECLINED', 'SEATS_NOT_HELD'),
  });
  if (error) throw error;
  return data;
}
