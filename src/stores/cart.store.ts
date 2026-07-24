import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const HOLD_TTL_MS = 600_000;

type CartState = {
  sessionId: string;
  eventId: number | null;
  seatIds: number[];
  expiresAt: number | null;
  expired: boolean;
  addSeat: (eventId: number, seatId: number, now: number) => void;
  removeSeat: (seatId: number) => void;
  clear: () => void;
  tick: (now: number) => void;
  ackExpired: () => void;
};

const emptyCart = { eventId: null, seatIds: [], expiresAt: null };

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      sessionId: crypto.randomUUID(),
      ...emptyCart,
      expired: false,
      addSeat: (eventId, seatId, now) => {
        const { eventId: current, seatIds } = get();
        if (current !== eventId || seatIds.length === 0) {
          set({ eventId, seatIds: [seatId], expiresAt: now + HOLD_TTL_MS });
          return;
        }
        if (seatIds.includes(seatId)) return;
        set({ seatIds: [...seatIds, seatId] });
      },
      removeSeat: (seatId) => {
        const seatIds = get().seatIds.filter((id) => id !== seatId);
        set(seatIds.length === 0 ? emptyCart : { seatIds });
      },
      clear: () => set(emptyCart),
      tick: (now) => {
        const { expiresAt } = get();
        if (expiresAt !== null && now >= expiresAt) {
          set({ ...emptyCart, expired: true });
        }
      },
      ackExpired: () => set({ expired: false }),
    }),
    {
      name: 'seatly-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ sessionId, eventId, seatIds, expiresAt }) => ({
        sessionId,
        eventId,
        seatIds,
        expiresAt,
      }),
    },
  ),
);

useCartStore.setState({ sessionId: useCartStore.getState().sessionId });

export function formatRemaining(expiresAt: number, now: number): string {
  const ms = Math.min(Math.max(expiresAt - now, 0), HOLD_TTL_MS);
  const seconds = Math.ceil(ms / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
