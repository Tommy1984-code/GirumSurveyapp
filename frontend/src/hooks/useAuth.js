import { useState, useEffect, useCallback } from 'react';
import { SESSION_TOKEN_KEY, ADMIN_USER_KEY } from '../constants';
import { getMe, logout as apiLogout } from '../services/api';

export function useAuth() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(SESSION_TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(ADMIN_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (authToken) {
      getMe(authToken)
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const handleLogin = useCallback((token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    apiLogout(authToken).finally(() => {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      setAuthToken(null);
      setCurrentUser(null);
    });
  }, [authToken]);

  return { authToken, currentUser, handleLogin, handleLogout, isAuthenticated: !!authToken };
}
