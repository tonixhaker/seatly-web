import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';

type Props = { role: 'guest' | 'buyer' | 'organizer'; children: ReactNode };

export function RoleGuard({ role, children }: Props) {
  const current = useAuthStore((state) =>
    state.token === null ? 'guest' : state.user?.role,
  );
  return current === role ? children : null;
}
