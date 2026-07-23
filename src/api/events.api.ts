import type { operations } from './core.gen';
import { coreClient } from './core';
import { handling } from './middleware';

export type EventFilters = NonNullable<
  operations['catalog.index']['parameters']['query']
>;

export async function listEvents(filters: EventFilters) {
  const { data, error } = await coreClient.GET('/api/v1/events', {
    params: { query: filters },
  });
  if (error) throw error;
  return data;
}

export async function getEvent(id: number) {
  const { data, error } = await coreClient.GET('/api/v1/events/{id}', {
    params: { path: { id } },
    middleware: handling('NOT_FOUND'),
  });
  if (error) throw error;
  return data;
}
