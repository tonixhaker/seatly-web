import { Link, useSearchParams } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganizerEvents, usePublishEvent } from '@/hooks/useOrganizer';

function readPage(params: URLSearchParams): number | undefined {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page > 1 ? page : undefined;
}

export function MyEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams);
  const { data, isPending, isError, isPlaceholderData } = useOrganizerEvents(
    page ? { page } : {},
  );
  const publish = usePublishEvent();

  const setPage = (next: number) =>
    setSearchParams(next > 1 ? { page: String(next) } : {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My events</h1>
        <Button asChild>
          <Link to="/organizer/events/new">New event</Link>
        </Button>
      </div>
      {isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : isError ? (
        <p className="text-destructive">Could not load your events.</p>
      ) : data.data.length === 0 ? (
        <p className="text-muted-foreground">No events yet.</p>
      ) : (
        <Table className={isPlaceholderData ? 'opacity-60' : ''}>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  {new Date(event.starts_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={event.status === 'draft' ? 'secondary' : 'default'}
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {event.status === 'draft' && (
                      <>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/organizer/events/${event.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            publish.isPending && publish.variables === event.id
                          }
                          onClick={() => publish.mutate(event.id)}
                        >
                          Publish
                        </Button>
                      </>
                    )}
                    {event.status === 'published' && (
                      <>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/organizer/events/${event.id}/dashboard`}>
                            Dashboard
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/events/${event.id}`}>View</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
