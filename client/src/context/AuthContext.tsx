import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, role?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ids_user');
    return saved ? JSON.parse(saved) : { id: 'usr_admin', username: 'admin', role: 'admin' };
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ids_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If we have token, verify session
    if (token) {
      api.getMe()
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('ids_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // Keep local fallback for offline/demo seamless experience
        });
    }
  }, [token]);

  const login = async (username: string, password: string = 'admin123') => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('ids_auth_token', res.token);
      localStorage.setItem('ids_user', JSON.stringify(res.user));
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ids_auth_token');
    localStorage.removeItem('ids_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
