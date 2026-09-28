import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { unwrapApiError } from '@/api/middleware';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckIn } from '@/hooks/useOrganizer';

const schema = z.object({
  qr_code: z.string().length(12, 'QR code must be exactly 12 characters'),
});

type CheckInForm = z.infer<typeof schema>;

function Result({ checkIn }: { checkIn: ReturnType<typeof useCheckIn> }) {
  if (checkIn.data) {
    const { event, seat, checked_in_at } = checkIn.data;
    return (
      <Alert>
        <AlertTitle>Checked in</AlertTitle>
        <AlertDescription>
          <p>{event.title}</p>
          <p>
            Section {seat.section}, row {seat.row}, seat {seat.number}
          </p>
          {checked_in_at !== null && (
            <p>{new Date(checked_in_at).toLocaleString()}</p>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  const apiError = unwrapApiError(checkIn.error);
  if (apiError?.code === 'ALREADY_CHECKED_IN') {
    const at = apiError.details?.checked_in_at;
    return (
      <Alert>
        <AlertDescription>
          {typeof at === 'string'
            ? `Already checked in at ${new Date(at).toLocaleString()}`
            : apiError.message}
        </AlertDescription>
      </Alert>
    );
  }
  if (apiError?.code === 'NOT_FOUND') {
    return (
      <Alert variant="destructive">
        <AlertDescription>Ticket not found</AlertDescription>
      </Alert>
    );
  }
  return null;
}

export function CheckInPage() {
  const checkIn = useCheckIn();
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<CheckInForm>({
    resolver: zodResolver(schema),
    defaultValues: { qr_code: '' },
  });

  const onSubmit = handleSubmit(({ qr_code }) =>
    checkIn.mutate(qr_code, {
      onSettled: () => {
        reset();
        setFocus('qr_code');
      },
    }),
  );

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Check-in</h1>
      <form noValidate className="flex flex-col gap-2" onSubmit={onSubmit}>
        <Label htmlFor="qr_code">QR code</Label>
        <div className="flex gap-2">
          <Input
            id="qr_code"
            autoFocus
            autoComplete="off"
            className="font-mono"
            {...register('qr_code')}
          />
          <Button type="submit" disabled={checkIn.isPending}>
            Check in
          </Button>
        </div>
        {errors.qr_code && (
          <p className="text-sm text-destructive">{errors.qr_code.message}</p>
        )}
      </form>
      <Result checkIn={checkIn} />
    </div>
  );
}
