import { Link, useSearchParams } from 'react-router';
import type { EventFilters } from '@/api/events.api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEvents } from '@/hooks/useEvents';

type DateParam = 'starts_from' | 'starts_until';

function readFilters(params: URLSearchParams): EventFilters {
  const filters: EventFilters = {};
  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page > 1) filters.page = page;
  const from = params.get('starts_from');
  if (from) filters.starts_from = from;
  const until = params.get('starts_until');
  if (until) filters.starts_until = until;
  return filters;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const { data, isPending, isError, isPlaceholderData } = useEvents(filters);

  const update = (mutate: (next: URLSearchParams) => void) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      mutate(next);
      return next;
    });

  const setDate = (key: DateParam, value: string) =>
    update((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
    });

  const setPage = (page: number) =>
    update((next) => {
      if (page > 1) next.set('page', String(page));
      else next.delete('page');
    });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="space-y-1">
          <Label htmlFor="starts_from">From</Label>
          <Input
            id="starts_from"
            type="date"
            value={filters.starts_from ?? ''}
            max={filters.starts_until ?? undefined}
            onChange={(e) => setDate('starts_from', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="starts_until">Until</Label>
          <Input
            id="starts_until"
            type="date"
            value={filters.starts_until ?? ''}
            min={filters.starts_from ?? undefined}
            onChange={(e) => setDate('starts_until', e.target.value)}
          />
        </div>
      </div>
      {isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : isError ? (
        <p className="text-destructive">Could not load events.</p>
      ) : data.data.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
      ) : (
        <ul
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {data.data.map((event) => (
            <li key={event.id}>
              <Link to={`/events/${event.id}`} className="block h-full">
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {new Date(event.starts_at).toLocaleString()}
                    </CardDescription>
                    <CardDescription>{event.venue.name}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data && (data.meta.last_page > 1 || data.meta.current_page > 1) && (
        <nav className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={data.meta.current_page <= 1}
            onClick={() => setPage(data.meta.current_page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.current_page} of {data.meta.last_page}
          </span>
          <Button
            variant="outline"
            disabled={data.meta.current_page >= data.meta.last_page}
            onClick={() => setPage(data.meta.current_page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
