import { create } from 'zustand';

export type SeatsSnapshot = { held: number[]; sold: number[] };

export type SeatDelta =
  | {
      type: 'seat.held';
      event_id: number;
      seat_ids: number[];
      session_id: string;
    }
  | { type: 'seat.released'; event_id: number; seat_ids: number[] }
  | { type: 'seat.sold'; event_id: number; seat_ids: number[] };

export type SeatColour = 'free' | 'held' | 'mine' | 'sold';

type SeatStatus = Record<number, 'held' | 'sold'>;
type SeatHolder = Record<number, string>;

type SeatsState = {
  eventId: number | null;
  status: SeatStatus;
  holder: SeatHolder;
  applySnapshot: (eventId: number, snapshot: SeatsSnapshot) => void;
  applyDelta: (delta: SeatDelta) => void;
  reset: () => void;
};

export const useSeatsStore = create<SeatsState>()((set, get) => ({
  eventId: null,
  status: {},
  holder: {},
  applySnapshot: (eventId, { held, sold }) => {
    const status: SeatStatus = {};
    for (const id of held) status[id] = 'held';
    for (const id of sold) status[id] = 'sold';
    set({ eventId, status, holder: {} });
  },
  applyDelta: (delta) => {
    if (delta.event_id !== get().eventId) return;
    const status = { ...get().status };
    const holder = { ...get().holder };
    for (const id of delta.seat_ids) {
      switch (delta.type) {
        case 'seat.held':
          if (status[id] === 'sold') break;
          status[id] = 'held';
          holder[id] = delta.session_id;
          break;
        case 'seat.released':
          if (status[id] === 'sold') break;
          delete status[id];
          delete holder[id];
          break;
        case 'seat.sold':
          status[id] = 'sold';
          delete holder[id];
          break;
        default: {
          const unreachable: never = delta;
          return unreachable;
        }
      }
    }
    set({ status, holder });
  },
  reset: () => set({ eventId: null, status: {}, holder: {} }),
}));

export function seatColour(
  seatId: number,
  state: Pick<SeatsState, 'status' | 'holder'>,
  cartSeatIds: readonly number[],
  sessionId: string,
): SeatColour {
  const seatStatus = state.status[seatId];
  if (seatStatus === 'sold') return 'sold';
  if (seatStatus !== 'held') return 'free';
  if (cartSeatIds.includes(seatId) || state.holder[seatId] === sessionId) {
    return 'mine';
  }
  return 'held';
}

export function restSnapshot(
  seats: readonly { id: number; status: string }[],
  live: SeatsSnapshot | undefined,
): SeatsSnapshot {
  const coreSold = seats.filter((s) => s.status === 'sold').map((s) => s.id);
  return {
    held: live?.held ?? [],
    sold: [...coreSold, ...(live?.sold ?? [])],
  };
}
