import { Link, Outlet } from 'react-router';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold">
            Seatly
          </Link>
          <nav className="flex items-center gap-4" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
