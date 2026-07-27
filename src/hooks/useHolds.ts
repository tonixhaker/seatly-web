import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { holdSeats, releaseSeats } from '@/api/holds.api';
import { unwrapApiError } from '@/api/middleware';
import { useCartStore } from '@/stores/cart.store';

type HoldInput = { eventId: number; seatId: number };
type ReleaseInput = { eventId: number; seatIds: number[]; silent?: boolean };

export function useHoldSeat() {
  return useMutation({
    mutationFn: ({ eventId, seatId }: HoldInput) =>
      holdSeats({
        event_id: eventId,
        seat_ids: [seatId],
        session_id: useCartStore.getState().sessionId,
      }),
    onSuccess: (_, { eventId, seatId }) =>
      useCartStore.getState().addSeat(eventId, seatId, Date.now()),
    onError: (error) => {
      if (unwrapApiError(error)?.code === 'SEATS_CONFLICT') {
        toast.error('That seat was just taken');
      }
    },
  });
}

export function useReleaseSeat() {
  return useMutation({
    mutationFn: ({ eventId, seatIds, silent }: ReleaseInput) =>
      releaseSeats(
        {
          event_id: eventId,
          seat_ids: seatIds,
          session_id: useCartStore.getState().sessionId,
        },
        silent,
      ),
    onSuccess: (_, { seatIds, silent }) => {
      if (silent) return;
      const { removeSeat } = useCartStore.getState();
      for (const id of seatIds) removeSeat(id);
    },
  });
}
