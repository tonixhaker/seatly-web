import { Link, Outlet } from 'react-router';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button';
import { useLogout, useSessionRefresh } from '@/hooks/useAuth';

export function AppLayout() {
  useSessionRefresh();
  const logout = useLogout();
  const logoutButton = (
    <Button
      variant="ghost"
      size="sm"
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
    >
      Logout
    </Button>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold">
            Seatly
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <RoleGuard role="guest">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </RoleGuard>
            <RoleGuard role="buyer">
              <Link to="/">Catalog</Link>
              <Link to="/my/tickets">My tickets</Link>
              {logoutButton}
            </RoleGuard>
            <RoleGuard role="organizer">
              <Link to="/organizer/events">My events</Link>
              <Link to="/organizer/check-in">Check-in</Link>
              {logoutButton}
            </RoleGuard>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
