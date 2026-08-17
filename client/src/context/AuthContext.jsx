import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const AuthContext = createContext(null); 

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null); // { type: 'success'|'error', message: string }

  // Check current session on first load
  useEffect(() => {
    api.get('/me')
      .then((res) => setCurrentUser(res.data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const showFlash = useCallback((type, message) => {
    setFlash({ type, message });
    // Auto-dismiss after 4s
    setTimeout(() => setFlash(null), 4000);
  }, []);

  const clearFlash = useCallback(() => setFlash(null), []);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/login', { username, password });
    setCurrentUser(res.data.user);
    showFlash('success', res.data.message);
    return res.data;
  }, [showFlash]);

  const signup = useCallback(async (username, email, password) => {
    const res = await api.post('/signup', { username, email, password });
    setCurrentUser(res.data.user);
    showFlash('success', res.data.message);
    return res.data;
  }, [showFlash]);

  const logout = useCallback(async () => {
    await api.get('/logout');
    setCurrentUser(null);
    showFlash('success', 'You have been logged out.');
  }, [showFlash]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/me');
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setCurrentUser(null);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, flash, showFlash, clearFlash, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
