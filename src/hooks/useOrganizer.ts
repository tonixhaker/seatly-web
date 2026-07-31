import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  createEvent,
  getOrganizerEvent,
  listOrganizerEvents,
  listVenues,
  publishEvent,
  updateEvent,
  type OrganizerEventFilters,
} from '@/api/organizer.api';
import { queryKeys } from '@/api/queryKeys';

export function useOrganizerEvents(filters: OrganizerEventFilters) {
  return useQuery({
    queryKey: queryKeys.organizerEvents.list(filters),
    queryFn: () => listOrganizerEvents(filters),
    placeholderData: keepPreviousData,
  });
}

export function useOrganizerEvent(id: number | null) {
  return useQuery({
    queryKey: queryKeys.organizerEvents.detail(id ?? 0),
    queryFn: () => getOrganizerEvent(id ?? 0),
    enabled: id !== null,
  });
}

export function useVenues() {
  return useQuery({
    queryKey: queryKeys.venues.list(),
    queryFn: listVenues,
    staleTime: Infinity,
  });
}

function useSaveSuccess() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.organizerEvents.all(),
    });
    navigate('/organizer/events');
  };
}

export function useCreateEvent() {
  return useMutation({ mutationFn: createEvent, onSuccess: useSaveSuccess() });
}

export function useUpdateEvent() {
  return useMutation({ mutationFn: updateEvent, onSuccess: useSaveSuccess() });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishEvent,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.organizerEvents.all(),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all() }),
      ]),
  });
}
