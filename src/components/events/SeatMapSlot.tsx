import { useLiveSeats } from '@/hooks/useLiveSeats';

export function SeatMapSlot({ eventId }: { eventId: number }) {
  useLiveSeats(eventId);
  return (
    <div
      data-event-id={eventId}
      className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
    >
      Seat map coming soon
    </div>
  );
}
