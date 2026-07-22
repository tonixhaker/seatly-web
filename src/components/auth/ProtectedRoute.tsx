import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';

type Props = { role?: 'buyer' | 'organizer' };

export function ProtectedRoute({ role }: Props) {
  const token = useAuthStore((state) => state.token);
  const userRole = useAuthStore((state) => state.user?.role);
  const { pathname, search } = useLocation();

  if (token === null) {
    return (
      <Navigate
        to={`/login?redirectTo=${encodeURIComponent(pathname + search)}`}
        replace
      />
    );
  }
  if (role !== undefined && userRole !== role) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
