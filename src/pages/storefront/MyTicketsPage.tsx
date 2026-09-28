import { Link } from 'react-router';
import type { Ticket } from '@/api/tickets.api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyTickets } from '@/hooks/useTickets';

function groupByEvent(tickets: Ticket[]): Ticket[][] {
  const groups = new Map<number, Ticket[]>();
  for (const ticket of tickets) {
    const group = groups.get(ticket.event.id) ?? [];
    group.push(ticket);
    groups.set(ticket.event.id, group);
  }
  return [...groups.values()];
}

export function MyTicketsPage() {
  const tickets = useMyTickets();

  if (tickets.isPending) {
    return <p className="text-muted-foreground">Loading tickets…</p>;
  }

  if (tickets.isError) {
    return (
      <p className="text-muted-foreground">Could not load your tickets.</p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My tickets</h1>
      {tickets.data.length === 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">No tickets yet</p>
          <Link to="/" className="font-medium underline">
            Browse events
          </Link>
        </div>
      ) : (
        groupByEvent(tickets.data).map((group) => (
          <Card key={group[0].event.id}>
            <CardHeader>
              <CardTitle>{group[0].event.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(group[0].event.starts_at).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {group.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span>
                      Section {ticket.seat.section}, row {ticket.seat.row}, seat{' '}
                      {ticket.seat.number}
                    </span>
                    <span className="font-mono text-xl tracking-widest">
                      {ticket.qr_code}
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                      <Badge
                        variant={
                          ticket.status === 'checked_in'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {ticket.status}
                      </Badge>
                      {ticket.checked_in_at !== null && (
                        <span className="text-muted-foreground">
                          Checked in{' '}
                          {new Date(ticket.checked_in_at).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
