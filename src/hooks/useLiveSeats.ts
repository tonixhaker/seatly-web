import { useQuery } from '@tanstack/react-query';
import { createContext, use, useEffect, useEffectEvent } from 'react';
import { getEventSeats, getLiveSeats } from '@/api/events.api';
import { queryKeys } from '@/api/queryKeys';
import { restSnapshot, useSeatsStore } from '@/stores/seats.store';

export type SocketContextValue = {
  connected: boolean;
  join: (eventId: number) => void;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

const POLL_INTERVAL_MS = 15_000;

export function useSocket(): SocketContextValue {
  const value = use(SocketContext);
  if (value === null) {
    throw new Error('useSocket must be used inside SocketProvider');
  }
  return value;
}

export function useLiveSeats(eventId: number) {
  const { connected, join } = useSocket();
  const refetchInterval = connected ? false : POLL_INTERVAL_MS;

  const seats = useQuery({
    queryKey: queryKeys.events.seats(eventId),
    queryFn: () => getEventSeats(eventId),
    refetchInterval,
  });
  const live = useQuery({
    queryKey: queryKeys.events.liveSeats(eventId),
    queryFn: () => getLiveSeats(eventId),
    refetchInterval,
  });

  useEffect(() => join(eventId), [eventId, join]);

  const apply = useEffectEvent(() => {
    if (seats.data === undefined || live.isPending) return;
    if (connected && useSeatsStore.getState().eventId === eventId) return;
    useSeatsStore
      .getState()
      .applySnapshot(
        eventId,
        restSnapshot(seats.data, live.isError ? undefined : live.data),
      );
  });

  useEffect(() => {
    apply();
  }, [eventId, seats.dataUpdatedAt, live.dataUpdatedAt, live.errorUpdatedAt]);

  return { connected, seats: seats.data };
}
