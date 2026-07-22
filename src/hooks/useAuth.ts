import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import * as authApi from '@/api/auth.api';
import { useAuthStore, type User } from '@/stores/auth.store';

function homeFor(role: string): string {
  return role === 'organizer' ? '/organizer/events' : '/';
}

function safeRedirect(target: string | null): string | null {
  if (target === null || !target.startsWith('/')) {
    return null;
  }
  const url = new URL(target, window.location.origin);
  return url.origin === window.location.origin
    ? `${url.pathname}${url.search}${url.hash}`
    : null;
}

function useSignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return ({ token, user }: { token: string; user: User }) => {
    useAuthStore.getState().login(token, user);
    navigate(
      safeRedirect(searchParams.get('redirectTo')) ?? homeFor(user.role),
      {
        replace: true,
      },
    );
  };
}

export function useLogin() {
  return useMutation({ mutationFn: authApi.login, onSuccess: useSignIn() });
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register, onSuccess: useSignIn() });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      useAuthStore.getState().logout();
      queryClient.clear();
      navigate('/', { replace: true });
    },
  });
}

export function useSessionRefresh() {
  const token = useAuthStore((state) => state.token);
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  });
  useEffect(() => {
    if (data) {
      useAuthStore.setState({ user: data });
    }
  }, [data]);
}
