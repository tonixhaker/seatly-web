import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { getMyTickets } from '@/api/tickets.api';

export function useMyTickets() {
  return useQuery({
    queryKey: queryKeys.tickets.mine(),
    queryFn: getMyTickets,
  });
}
