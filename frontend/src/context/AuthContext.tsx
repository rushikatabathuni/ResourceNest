import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on app load
    const savedToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (savedToken && userData) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    setToken(response.access_token);
    setUser(response.user);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      handleAuthSuccess(response);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.adminLogin(email, password);
      handleAuthSuccess(response);
      toast.success('Admin access granted');
    } catch (error: any) {
      toast.error(error.message || 'Admin login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await apiService.register(email, password);
      handleAuthSuccess(response);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    adminLogin,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
