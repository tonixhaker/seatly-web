import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getEvent,
  getEventSeats,
  listEvents,
  type EventFilters,
} from '@/api/events.api';
import { queryKeys } from '@/api/queryKeys';

export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => listEvents(filters),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(id: number | null) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? 0),
    queryFn: () => getEvent(id ?? 0),
    enabled: id !== null,
  });
}

export function useEventSeats(id: number | null) {
  return useQuery({
    queryKey: queryKeys.events.seats(id ?? 0),
    queryFn: () => getEventSeats(id ?? 0),
    enabled: id !== null,
  });
}
