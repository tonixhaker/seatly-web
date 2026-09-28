import { Link, useParams } from 'react-router';
import { unwrapApiError } from '@/api/middleware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventStats, useOrganizerEvent } from '@/hooks/useOrganizer';
import { formatPrice } from '@/lib/utils';

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const rawId = useParams().id ?? '';
  const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  const event = useOrganizerEvent(id);
  const stats = useEventStats(id);

  if (
    id === null ||
    unwrapApiError(event.error)?.code === 'NOT_FOUND' ||
    unwrapApiError(stats.error)?.code === 'NOT_FOUND'
  ) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <Link to="/organizer/events" className="underline">
          Back to my events
        </Link>
      </div>
    );
  }
  if (stats.error) {
    return <p className="text-destructive">Could not load this event.</p>;
  }
  if (stats.isPending) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const { seats_sold, seats_free, seats_total, revenue_cents, currency } =
    stats.data;
  const percent = seats_total ? (seats_sold / seats_total) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {event.data?.title ?? 'Dashboard'}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Sold" value={seats_sold} />
        <StatTile label="Free" value={seats_free} />
        <StatTile label="Total" value={seats_total} />
        <StatTile
          label="Revenue"
          value={formatPrice(revenue_cents, currency)}
        />
      </div>
      <div className="space-y-2">
        <div
          role="progressbar"
          aria-valuenow={seats_sold}
          aria-valuemin={0}
          aria-valuemax={seats_total}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {seats_sold} of {seats_total} sold
        </p>
      </div>
    </div>
  );
}
