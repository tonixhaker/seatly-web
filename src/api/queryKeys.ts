import type { EventFilters } from './events.api';

export const queryKeys = {
  events: {
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
    seats: (id: number) => ['events', 'seats', id] as const,
    liveSeats: (id: number) => ['events', 'live-seats', id] as const,
  },
};
