import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { SocketProvider } from '@/components/realtime/SocketProvider';
import { Toaster } from '@/components/ui/sonner';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { CheckInPage } from '@/pages/organizer/CheckInPage';
import { DashboardPage } from '@/pages/organizer/DashboardPage';
import { EventFormPage } from '@/pages/organizer/EventFormPage';
import { MyEventsPage } from '@/pages/organizer/MyEventsPage';
import { CatalogPage } from '@/pages/storefront/CatalogPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { EventPage } from '@/pages/storefront/EventPage';
import { MyTicketsPage } from '@/pages/storefront/MyTicketsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 1 && error instanceof Error,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/events/:id" element={<EventPage />} />
              <Route element={<ProtectedRoute role="buyer" />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/my/tickets" element={<MyTicketsPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute role="organizer" />}>
                <Route path="/organizer/events" element={<MyEventsPage />} />
                <Route
                  path="/organizer/events/new"
                  element={<EventFormPage />}
                />
                <Route
                  path="/organizer/events/:id/edit"
                  element={<EventFormPage />}
                />
                <Route
                  path="/organizer/events/:id/dashboard"
                  element={<DashboardPage />}
                />
                <Route path="/organizer/check-in" element={<CheckInPage />} />
              </Route>
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
