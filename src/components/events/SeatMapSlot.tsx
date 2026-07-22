export function SeatMapSlot({ eventId }: { eventId: number }) {
  return (
    <div
      data-event-id={eventId}
      className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
    >
      Seat map coming soon
    </div>
  );
}
