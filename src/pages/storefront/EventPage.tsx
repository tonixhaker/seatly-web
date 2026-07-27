import { Link, useParams } from 'react-router';
import { unwrapApiError } from '@/api/middleware';
import { SeatMapSlot } from '@/components/events/SeatMapSlot';
import { LiveUpdatesBanner } from '@/components/realtime/SocketProvider';
import { useEvent } from '@/hooks/useEvents';

function parseId(raw: string | undefined): number | null {
  return raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null;
}

function EventNotFound() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Event not found</h1>
      <Link to="/" className="underline">
        Back to events
      </Link>
    </div>
  );
}

export function EventPage() {
  const id = parseId(useParams().id);
  const { data: event, error, isPending } = useEvent(id);

  if (id === null || unwrapApiError(error)?.code === 'NOT_FOUND') {
    return <EventNotFound />;
  }
  if (error) {
    return <p className="text-destructive">Could not load this event.</p>;
  }
  if (isPending) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <article className="space-y-6">
      <Link to="/" className="text-sm underline">
        Back to events
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-muted-foreground">
          {new Date(event.starts_at).toLocaleString()}
        </p>
        <p className="text-muted-foreground">
          {event.venue.name}, {event.venue.address}, {event.venue.city}
        </p>
      </header>
      <p className="whitespace-pre-line">{event.description}</p>
      <LiveUpdatesBanner />
      <SeatMapSlot eventId={event.id} />
    </article>
  );
}
