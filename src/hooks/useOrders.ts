import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { unwrapApiError } from '@/api/middleware';
import { placeOrder } from '@/api/orders.api';
import { queryKeys } from '@/api/queryKeys';
import { useCartStore } from '@/stores/cart.store';

export type PlaceOrderInput = {
  eventId: number;
  seatIds: number[];
  idempotencyKey: string;
};

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ eventId, seatIds, idempotencyKey }: PlaceOrderInput) =>
      placeOrder({
        event_id: eventId,
        seat_ids: seatIds,
        session_id: useCartStore.getState().sessionId,
        idempotency_key: idempotencyKey,
      }),
    retry: (failureCount, error) => failureCount < 1 && error instanceof Error,
    onSuccess: async (order) => {
      if (order.status !== 'paid') return;
      useCartStore.getState().clear();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.mine(),
      });
      navigate('/my/tickets');
    },
    onError: (error) => {
      if (unwrapApiError(error)?.code === 'SEATS_NOT_HELD') {
        useCartStore.getState().clear();
      }
    },
  });
}
