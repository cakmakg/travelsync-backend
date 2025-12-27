import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, register, checkAuth, clearError } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    checkAuth,
    clearError,
  };
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location]);

  return { isAuthenticated, isLoading };
}

export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}
