import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  // Redirecionar em efeito separado para evitar erro de renderização
  useEffect(() => {
    if (authError?.type === 'auth_required' && !isLoadingAuth) {
      navigate('/login');
    }
  }, [authError, isLoadingAuth, navigate]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoadingAuth(false);
      setAuthError({ type: 'auth_required' });
      return;
    }

    try {
      const response = await base44.get('/auth/me');
      setUser(response.data);
      setAuthError(null);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('token');
      setAuthError({ type: 'auth_required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await base44.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      setAuthError(null);
      
      return { success: true, user };
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.message || 'Erro ao fazer login';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await base44.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setAuthError({ type: 'auth_required' });
      navigate('/login');
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const value = {
    user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    login,
    logout,
    checkAuth,
    navigateToLogin,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};