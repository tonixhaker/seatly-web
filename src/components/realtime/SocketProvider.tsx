import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { SocketContext, useSocket } from '@/hooks/useLiveSeats';
import { useSeatsStore, type SeatDelta } from '@/stores/seats.store';

type DeltaPayload<T extends SeatDelta['type']> = Omit<
  Extract<SeatDelta, { type: T }>,
  'type'
>;

type ServerEvents = {
  snapshot: (payload: {
    event_id: number;
    held: number[];
    sold: number[];
  }) => void;
  'seat.held': (payload: DeltaPayload<'seat.held'>) => void;
  'seat.released': (payload: DeltaPayload<'seat.released'>) => void;
  'seat.sold': (payload: DeltaPayload<'seat.sold'>) => void;
};

type ClientEvents = {
  join: (payload: { event_id: number }) => void;
};

const SNAPSHOT_TIMEOUT_MS = 5000;

const socket: Socket<ServerEvents, ClientEvents> = io(
  `${import.meta.env.VITE_REALTIME_BASE_URL}/events`,
  {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
  },
);

function subscribe(onChange: () => void) {
  socket.on('connect', onChange);
  socket.on('disconnect', onChange);
  return () => {
    socket.off('connect', onChange);
    socket.off('disconnect', onChange);
  };
}

function isConnected() {
  return socket.connected;
}

let currentEventId: number | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function stopRetry() {
  clearTimeout(retryTimer);
}

function sendJoin() {
  stopRetry();
  if (currentEventId === null || !socket.connected) return;
  socket.emit('join', { event_id: currentEventId });
  retryTimer = setTimeout(sendJoin, SNAPSHOT_TIMEOUT_MS);
}

function join(eventId: number) {
  currentEventId = eventId;
  sendJoin();
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const connected = useSyncExternalStore(subscribe, isConnected);

  useEffect(() => {
    const { applySnapshot, applyDelta } = useSeatsStore.getState();
    const onSnapshot: ServerEvents['snapshot'] = ({ event_id, held, sold }) => {
      if (event_id !== currentEventId) return;
      stopRetry();
      applySnapshot(event_id, { held, sold });
    };
    const onHeld: ServerEvents['seat.held'] = (p) =>
      applyDelta({ type: 'seat.held', ...p });
    const onReleased: ServerEvents['seat.released'] = (p) =>
      applyDelta({ type: 'seat.released', ...p });
    const onSold: ServerEvents['seat.sold'] = (p) =>
      applyDelta({ type: 'seat.sold', ...p });

    socket.on('connect', sendJoin);
    socket.on('disconnect', stopRetry);
    socket.on('snapshot', onSnapshot);
    socket.on('seat.held', onHeld);
    socket.on('seat.released', onReleased);
    socket.on('seat.sold', onSold);
    socket.connect();

    return () => {
      stopRetry();
      socket.off('connect', sendJoin);
      socket.off('disconnect', stopRetry);
      socket.off('snapshot', onSnapshot);
      socket.off('seat.held', onHeld);
      socket.off('seat.released', onReleased);
      socket.off('seat.sold', onSold);
    };
  }, []);

  const value = useMemo(() => ({ connected, join }), [connected]);

  return <SocketContext value={value}>{children}</SocketContext>;
}

export function LiveUpdatesBanner() {
  const { connected } = useSocket();
  if (connected) return null;
  return (
    <Alert>
      <AlertTitle>Live updates unavailable</AlertTitle>
    </Alert>
  );
}
