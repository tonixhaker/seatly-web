import type { components } from './core.gen';
import { coreClient } from './core';

export type Ticket = components['schemas']['TicketResource'];

export async function getMyTickets() {
  const { data, error } = await coreClient.GET('/api/v1/my/tickets');
  if (error) throw error;
  return data;
}
