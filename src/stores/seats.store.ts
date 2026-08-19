import { create } from 'zustand';

export type SeatsSnapshot = { held: number[]; sold: number[] };

export type SeatDelta =
  | { type: 'seat.held'; event_id: number; seat_ids: number[] }
  | { type: 'seat.released'; event_id: number; seat_ids: number[] }
  | { type: 'seat.sold'; event_id: number; seat_ids: number[] };

export type SeatColour = 'free' | 'held' | 'mine' | 'sold';

type SeatStatus = Record<number, 'held' | 'sold'>;

type SeatsState = {
  eventId: number | null;
  status: SeatStatus;
  applySnapshot: (eventId: number, snapshot: SeatsSnapshot) => void;
  applyDelta: (delta: SeatDelta) => void;
  reset: () => void;
};

export const useSeatsStore = create<SeatsState>()((set, get) => ({
  eventId: null,
  status: {},
  applySnapshot: (eventId, { held, sold }) => {
    const status: SeatStatus = {};
    for (const id of held) status[id] = 'held';
    for (const id of sold) status[id] = 'sold';
    set({ eventId, status });
  },
  applyDelta: (delta) => {
    if (delta.event_id !== get().eventId) return;
    const status = { ...get().status };
    for (const id of delta.seat_ids) {
      switch (delta.type) {
        case 'seat.held':
          if (status[id] === 'sold') break;
          status[id] = 'held';
          break;
        case 'seat.released':
          if (status[id] === 'sold') break;
          delete status[id];
          break;
        case 'seat.sold':
          status[id] = 'sold';
          break;
        default: {
          const unreachable: never = delta;
          return unreachable;
        }
      }
    }
    set({ status });
  },
  reset: () => set({ eventId: null, status: {} }),
}));

export function seatColour(
  seatId: number,
  state: Pick<SeatsState, 'status'>,
  cartSeatIds: readonly number[],
): SeatColour {
  const seatStatus = state.status[seatId];
  if (seatStatus === 'sold') return 'sold';
  if (seatStatus !== 'held') return 'free';
  return cartSeatIds.includes(seatId) ? 'mine' : 'held';
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
