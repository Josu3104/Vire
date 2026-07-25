// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as authApi from '@/features/auth/api/auth.api';
import apiClient from '@/core/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError]     = useState(null);
  const [isLoading, setIsLoading]     = useState(true);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.getProfile()
        .then(user => {
          setCurrentUser(user);
        })
        .catch((error) => {
          if (error?.response?.status === 401) {
            localStorage.removeItem('access_token');
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await authApi.login(email, password);
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        setCurrentUser(response.user);
        setIsLoading(false);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Credenciales inválidas');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (data) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      if (data.ieeeId && data.ieeeId.trim() !== '') {
        payload.affiliation = `IEEE-${data.ieeeId.trim()}`;
        payload.pendingVerification = true;
      } else if (data.cimeqhId && data.cimeqhId.trim() !== '') {
        payload.affiliation = `CIMEQH-${data.cimeqhId.trim()}`;
        payload.pendingVerification = true;
      }

      const response = await authApi.register(payload);
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        setCurrentUser(response.user);
        setIsLoading(false);
        return { success: true, user: response.user };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrar usuario';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      await authApi.updateProfile(data);
      setCurrentUser((prev) => prev ? { ...prev, ...data } : prev);
      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: 'Error actualizando perfil' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [logout]);

  const contextValue = useMemo(() => ({
    currentUser,
    isAuthenticated,
    isAdmin,
    isLoading,
    authError,
    login,
    register,
    logout,
    clearError,
    updateProfile,
  }), [currentUser, isAuthenticated, isAdmin, isLoading, authError, login, register, logout, clearError, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
