import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Usuario, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  usuario: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('grassbooking_token');
    const usuarioGuardado = localStorage.getItem('grassbooking_user');

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

    localStorage.setItem('grassbooking_token', nuevoToken);
    localStorage.setItem('grassbooking_user', JSON.stringify(nuevoUsuario));

    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await authService.register(data);
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    localStorage.removeItem('grassbooking_token');
    localStorage.removeItem('grassbooking_user');
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isAuthenticated: !!token && !!usuario,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
