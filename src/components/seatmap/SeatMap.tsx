import { useEffect, type KeyboardEvent, type SVGProps } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { components } from '@/api/core.gen';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useHoldCountdown } from '@/hooks/useHoldCountdown';
import { useHoldSeat, useReleaseSeat } from '@/hooks/useHolds';
import { useLiveSeats } from '@/hooks/useLiveSeats';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import {
  seatColour,
  useSeatsStore,
  type SeatColour,
} from '@/stores/seats.store';

type Seat = components['schemas']['SeatResource'];

const SEAT_RADIUS = 14;
const PADDING = 30;
const SOLD_PATTERN_ID = 'seat-sold-hatch';

const COLOURS: SeatColour[] = ['free', 'held', 'mine', 'sold'];

const COLOUR_LABEL: Record<SeatColour, string> = {
  free: 'free',
  held: 'held by someone else',
  mine: 'held by you',
  sold: 'sold',
};

const COLOUR_STYLE: Record<SeatColour, SVGProps<SVGCircleElement>> = {
  free: { fill: '#22c55e', stroke: '#15803d', strokeWidth: 1 },
  held: { fill: '#f59e0b', stroke: '#b45309', strokeWidth: 1 },
  mine: { fill: '#2563eb', stroke: '#0f172a', strokeWidth: 4 },
  sold: {
    fill: `url(#${SOLD_PATTERN_ID})`,
    stroke: '#475569',
    strokeWidth: 2,
    strokeDasharray: '4 3',
  },
};

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(
    cents / 100,
  );
}

function viewBox(seats: readonly Seat[]): string {
  const xs = seats.map((s) => s.x);
  const ys = seats.map((s) => s.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const width = Math.max(...xs) - Math.min(...xs) + 2 * PADDING;
  const height = Math.max(...ys) - Math.min(...ys) + 2 * PADDING;
  return `${minX} ${minY} ${width} ${height}`;
}

function SoldPattern() {
  return (
    <defs>
      <pattern
        id={SOLD_PATTERN_ID}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill="#cbd5e1" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-4 text-sm">
      {COLOURS.map((colour) => (
        <li key={colour} className="flex items-center gap-2">
          <svg viewBox="-16 -16 32 32" className="size-5" aria-hidden="true">
            <circle r={SEAT_RADIUS} {...COLOUR_STYLE[colour]} />
          </svg>
          <span className="capitalize">{COLOUR_LABEL[colour]}</span>
        </li>
      ))}
    </ul>
  );
}

function CartPanel({ eventId, seats }: { eventId: number; seats: Seat[] }) {
  const countdown = useHoldCountdown();
  const cartEventId = useCartStore((s) => s.eventId);
  const seatIds = useCartStore((s) => s.seatIds);
  const isBuyer = useAuthStore((s) => s.user?.role === 'buyer');

  const selected =
    cartEventId === eventId
      ? seats.filter((seat) => seatIds.includes(seat.id))
      : [];
  const total = selected.reduce((sum, seat) => sum + seat.price_cents, 0);
  const checkoutTo = isBuyer
    ? '/checkout'
    : `/login?redirectTo=${encodeURIComponent('/checkout')}`;

  return (
    <Card className="w-full lg:w-72">
      <CardHeader>
        <CardTitle>Your seats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {selected.length === 0 ? (
          <p className="text-muted-foreground">No seats selected</p>
        ) : (
          <>
            <ul className="space-y-1">
              {selected.map((seat) => (
                <li key={seat.id} className="flex justify-between gap-2">
                  <span>
                    {seat.section}, row {seat.row}, seat {seat.number}
                  </span>
                  <span>{formatPrice(seat.price_cents, seat.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(total, selected[0].currency)}</span>
            </p>
            {countdown !== null && (
              <p aria-live="polite">
                Hold expires in{' '}
                <span className="font-mono font-medium">{countdown}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        {selected.length === 0 ? (
          <Button className="w-full" disabled>
            Checkout
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link to={checkoutTo}>Checkout</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function SeatMap({ eventId }: { eventId: number }) {
  const { connected, seats } = useLiveSeats(eventId);
  const status = useSeatsStore((s) => s.status);
  const holder = useSeatsStore((s) => s.holder);
  const cartSeatIds = useCartStore((s) => s.seatIds);
  const sessionId = useCartStore((s) => s.sessionId);
  const hold = useHoldSeat();
  const release = useReleaseSeat();
  const { mutate: releaseExpired } = useReleaseSeat();

  useEffect(
    () =>
      useCartStore.subscribe((state, prev) => {
        if (!state.expired || prev.expired) return;
        state.ackExpired();
        toast('Your hold expired');
        if (prev.eventId !== null && prev.seatIds.length > 0) {
          releaseExpired({
            eventId: prev.eventId,
            seatIds: prev.seatIds,
            silent: true,
          });
        }
      }),
    [releaseExpired],
  );

  if (seats === undefined) {
    return <p className="text-muted-foreground">Loading seats…</p>;
  }

  const busy = !connected || hold.isPending || release.isPending;

  function activate(seatId: number, colour: SeatColour) {
    if (busy) return;
    if (colour === 'free') hold.mutate({ eventId, seatId });
    if (colour === 'mine') release.mutate({ eventId, seatIds: [seatId] });
  }

  function onKeyDown(
    event: KeyboardEvent<SVGCircleElement>,
    seatId: number,
    colour: SeatColour,
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(seatId, colour);
  }

  return (
    <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 space-y-3">
        <svg
          viewBox={seats.length > 0 ? viewBox(seats) : '0 0 100 100'}
          className="w-full rounded-lg border bg-muted/30"
          aria-label="Seat map"
        >
          <SoldPattern />
          {seats.map((seat) => {
            const colour = seatColour(
              seat.id,
              { status, holder },
              cartSeatIds,
              sessionId,
            );
            const disabled =
              !connected || colour === 'held' || colour === 'sold';
            return (
              <circle
                key={seat.id}
                cx={seat.x}
                cy={seat.y}
                r={SEAT_RADIUS}
                role="button"
                tabIndex={0}
                aria-disabled={disabled}
                aria-label={`${seat.section}, row ${seat.row}, seat ${seat.number}, ${formatPrice(seat.price_cents, seat.currency)}, ${COLOUR_LABEL[colour]}`}
                data-colour={colour}
                className={
                  disabled
                    ? 'cursor-not-allowed outline-none focus-visible:stroke-ring'
                    : 'cursor-pointer outline-none focus-visible:stroke-ring'
                }
                onClick={() => activate(seat.id, colour)}
                onKeyDown={(event) => onKeyDown(event, seat.id, colour)}
                {...COLOUR_STYLE[colour]}
              />
            );
          })}
        </svg>
        <Legend />
      </div>
      <CartPanel eventId={eventId} seats={seats} />
    </section>
  );
}
