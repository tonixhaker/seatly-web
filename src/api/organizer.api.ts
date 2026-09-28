import type { components, operations } from './core.gen';
import { coreClient } from './core';
import { handling } from './middleware';

export type OrganizerEventFilters = NonNullable<
  operations['organizer.index']['parameters']['query']
>;
export type EventBody = components['schemas']['CreateEventRequest'];

export async function listOrganizerEvents(filters: OrganizerEventFilters) {
  const { data, error } = await coreClient.GET('/api/v1/organizer/events', {
    params: { query: filters },
  });
  if (error) throw error;
  return data;
}

export async function getOrganizerEvent(id: number) {
  const { data, error } = await coreClient.GET(
    '/api/v1/organizer/events/{id}',
    { params: { path: { id } }, middleware: handling('NOT_FOUND') },
  );
  if (error) throw error;
  return data;
}

export async function listVenues() {
  const { data, error } = await coreClient.GET('/api/v1/organizer/venues', {});
  if (error) throw error;
  return data;
}

export async function createEvent(body: EventBody) {
  const { data, error } = await coreClient.POST('/api/v1/organizer/events', {
    body,
    middleware: handling('VALIDATION_FAILED'),
  });
  if (error) throw error;
  return data;
}

export async function updateEvent({
  id,
  body,
}: {
  id: number;
  body: EventBody;
}) {
  const { data, error } = await coreClient.PUT(
    '/api/v1/organizer/events/{id}',
    {
      params: { path: { id } },
      body,
      middleware: handling('VALIDATION_FAILED'),
    },
  );
  if (error) throw error;
  return data;
}

export async function publishEvent(id: number) {
  const { data, error } = await coreClient.POST(
    '/api/v1/organizer/events/{id}/publish',
    { params: { path: { id } } },
  );
  if (error) throw error;
  return data;
}

export async function getEventStats(id: number) {
  const { data, error } = await coreClient.GET(
    '/api/v1/organizer/events/{id}/stats',
    { params: { path: { id } }, middleware: handling('NOT_FOUND') },
  );
  if (error) throw error;
  return data;
}

export async function checkIn(qr_code: string) {
  const { data, error } = await coreClient.POST('/api/v1/organizer/check-in', {
    body: { qr_code },
    middleware: handling('ALREADY_CHECKED_IN', 'NOT_FOUND'),
  });
  if (error) throw error;
  return data;
}
