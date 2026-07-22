import type { EventFilters } from './events.api';

export const queryKeys = {
  events: {
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
  },
};
