import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { z } from 'zod';
import { unwrapApiError } from '@/api/middleware';
import type { components } from '@/api/core.gen';
import type { EventBody } from '@/api/organizer.api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateEvent,
  useOrganizerEvent,
  useUpdateEvent,
  useVenues,
} from '@/hooks/useOrganizer';

type EventDetail = components['schemas']['EventDetailResource'];

const schema = z.object({
  venue_id: z.string().min(1, 'Select a venue'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255)
    .refine(
      (v) =>
        ![...v].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127),
      'Title contains invalid characters',
    ),
  description: z
    .string()
    .max(2000)
    .refine(
      (v) => !v.includes('\x00'),
      'Description contains invalid characters',
    ),
  starts_at: z
    .string()
    .min(1, 'Start time is required')
    .refine((v) => new Date(v).getTime() > Date.now(), 'Must be in the future'),
});

type EventForm = z.infer<typeof schema>;

const fields = ['venue_id', 'title', 'description', 'starts_at'] as const;

function parseId(raw: string | undefined): number | null {
  return raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null;
}

function toServerTime(local: string): string {
  return new Date(local).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function toBody(values: EventForm): EventBody {
  return {
    venue_id: Number(values.venue_id),
    title: values.title,
    description: values.description === '' ? null : values.description,
    starts_at: toServerTime(values.starts_at),
  };
}

function BackLink() {
  return (
    <Link to="/organizer/events" className="underline">
      Back to my events
    </Link>
  );
}

function EventForm({ event }: { event?: EventDetail }) {
  const venues = useVenues();
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const saving = create.isPending || update.isPending;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? {
          venue_id: String(event.venue.id),
          title: event.title,
          description: event.description,
          starts_at: toLocalInput(event.starts_at),
        }
      : { venue_id: '', title: '', description: '', starts_at: '' },
  });

  const onError = (error: unknown) => {
    const apiError = unwrapApiError(error);
    if (apiError?.code !== 'VALIDATION_FAILED') {
      return;
    }
    const details = apiError.details ?? {};
    let mapped = false;
    for (const field of fields) {
      const messages = details[field];
      if (Array.isArray(messages) && typeof messages[0] === 'string') {
        setError(field, { message: messages[0] });
        mapped = true;
      }
    }
    if (!mapped) {
      setError('root', { message: apiError.message });
    }
  };

  const onSubmit = handleSubmit((values) => {
    const body = toBody(values);
    if (event) {
      update.mutate({ id: event.id, body }, { onError });
    } else {
      create.mutate(body, { onError });
    }
  });

  const fieldError = (field: (typeof fields)[number]) =>
    errors[field] && (
      <p className="text-sm text-destructive">{errors[field].message}</p>
    );

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>{event ? 'Edit event' : 'New event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate className="flex flex-col gap-4" onSubmit={onSubmit}>
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {fieldError('title')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
              {...register('description')}
            />
            {fieldError('description')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="starts_at">Starts at</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              {...register('starts_at')}
            />
            {fieldError('starts_at')}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue_id">Venue</Label>
            <Controller
              control={control}
              name="venue_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={venues.isPending}
                >
                  <SelectTrigger id="venue_id" className="w-full">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.data?.map((venue) => (
                      <SelectItem key={venue.id} value={String(venue.id)}>
                        {venue.name}, {venue.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {fieldError('venue_id')}
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              {event ? 'Save' : 'Create draft'}
            </Button>
            <BackLink />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EventFormPage() {
  const rawId = useParams().id;
  const id = parseId(rawId);
  const { data: event, error, isPending } = useOrganizerEvent(id);

  if (rawId === undefined) {
    return <EventForm />;
  }
  if (id === null || unwrapApiError(error)?.code === 'NOT_FOUND') {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <BackLink />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive">Could not load this event.</p>;
  }
  if (isPending) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (event.status !== 'draft') {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <Alert>
          <AlertDescription>
            This event is {event.status} and can no longer be edited. Only
            drafts can be changed.
          </AlertDescription>
        </Alert>
        <BackLink />
      </div>
    );
  }
  return <EventForm event={event} />;
}
