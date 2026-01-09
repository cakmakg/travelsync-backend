import { useAppDispatch, useAppSelector } from './redux';
import { login, register, logout, getCurrentUser } from '@/store/slices/authSlice';
import { LoginCredentials, RegisterData } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async (credentials: LoginCredentials) => {
    const result = await dispatch(login(credentials));
    return result;
  };

  const handleRegister = async (data: RegisterData) => {
    const result = await dispatch(register(data));
    return result;
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  const fetchCurrentUser = async () => {
    await dispatch(getCurrentUser());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    getCurrentUser: fetchCurrentUser,
  };
};
