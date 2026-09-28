import { handling } from './middleware';
import { type HoldSeatsBody, realtimeClient } from './realtime';

export async function holdSeats(body: HoldSeatsBody) {
  const { error } = await realtimeClient.POST('/holds', {
    body,
    middleware: handling('SEATS_CONFLICT'),
  });
  if (error) throw error;
}

export async function releaseSeats(body: HoldSeatsBody, silent = false) {
  const { error } = await realtimeClient.DELETE('/holds', {
    body,
    middleware: silent ? handling('*') : [],
  });
  if (error) throw error;
}
