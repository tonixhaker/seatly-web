import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { components } from '@/api/core.gen';

export type User = components['schemas']['UserResource'];

type AuthState = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.removeItem('seatly-auth');
        set({ token, user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'seatly-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
);
