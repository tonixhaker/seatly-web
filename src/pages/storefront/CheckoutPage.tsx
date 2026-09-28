import { Link } from 'react-router';
import { unwrapApiError } from '@/api/middleware';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEventSeats } from '@/hooks/useEvents';
import { useHoldCountdown } from '@/hooks/useHoldCountdown';
import { useHoldExpiry } from '@/hooks/useHolds';
import { usePlaceOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';

export function CheckoutPage() {
  useHoldExpiry();
  const countdown = useHoldCountdown();
  const eventId = useCartStore((s) => s.eventId);
  const seatIds = useCartStore((s) => s.seatIds);
  const seats = useEventSeats(eventId);
  const pay = usePlaceOrder();

  const errorCode = unwrapApiError(pay.error)?.code;
  const declined =
    errorCode === 'PAYMENT_DECLINED' ||
    (pay.data !== undefined && pay.data.status !== 'paid');
  const networkFailed = pay.error instanceof Error;

  if (errorCode === 'SEATS_NOT_HELD' && pay.variables !== undefined) {
    return (
      <Alert variant="destructive" className="max-w-xl">
        <AlertDescription>
          <p>Your seat holds expired before payment, so nothing was charged.</p>
          <Link
            to={`/events/${pay.variables.eventId}`}
            className="font-medium underline"
          >
            Back to the event
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (eventId === null || seatIds.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">No seats held</p>
        <Link to="/" className="font-medium underline">
          Browse events
        </Link>
      </div>
    );
  }

  const selected = (seats.data ?? []).filter((seat) =>
    seatIds.includes(seat.id),
  );
  const total = selected.reduce((sum, seat) => sum + seat.price_cents, 0);

  function onPay() {
    if (eventId === null) return;
    pay.mutate({ eventId, seatIds, idempotencyKey: crypto.randomUUID() });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {seats.data === undefined ? (
          <p className="text-muted-foreground">Loading seats…</p>
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
            {selected.length > 0 && (
              <p className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(total, selected[0].currency)}</span>
              </p>
            )}
          </>
        )}
        {countdown !== null && (
          <p aria-live="polite">
            Hold expires in{' '}
            <span className="font-mono font-medium">{countdown}</span>
          </p>
        )}
        {declined && (
          <Alert variant="destructive">
            <AlertDescription>
              Payment declined — your seats are still held, try again
            </AlertDescription>
          </Alert>
        )}
        {networkFailed && (
          <Alert variant="destructive">
            <AlertDescription>
              Payment could not be completed. Try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={pay.isPending} onClick={onPay}>
          {pay.isPending ? 'Processing payment…' : 'Pay'}
        </Button>
      </CardFooter>
    </Card>
  );
}
