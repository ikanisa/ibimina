import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { LoginRequest } from '@/types/auth';
import { useAuthStore } from '@/stores/auth';
import { setAccessToken, setCurrentUser, clearAuth } from '@/lib/auth';

export const useLogin = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setCurrentUser(data.user);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      logout();
      queryClient.clear();
    },
  });
};
