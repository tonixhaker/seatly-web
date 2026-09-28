import type { EventFilters } from './events.api';
import type { OrganizerEventFilters } from './organizer.api';

export const queryKeys = {
  events: {
    all: () => ['events'] as const,
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
    seats: (id: number) => ['events', 'seats', id] as const,
    liveSeats: (id: number) => ['events', 'live-seats', id] as const,
  },
  organizerEvents: {
    all: () => ['organizer-events'] as const,
    list: (filters: OrganizerEventFilters) =>
      ['organizer-events', 'list', filters] as const,
    detail: (id: number) => ['organizer-events', 'detail', id] as const,
    stats: (id: number) => ['organizer-events', 'stats', id] as const,
  },
  venues: {
    list: () => ['venues', 'list'] as const,
  },
  tickets: {
    mine: () => ['tickets', 'list', 'mine'] as const,
  },
};
