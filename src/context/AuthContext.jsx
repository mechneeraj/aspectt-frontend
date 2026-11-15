import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';
import { DEFAULT_AVATAR_URL, AVATAR_OPTIONS } from '../data/avatars';

const USER_STORAGE_KEY = 'aspectt_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Stored JWT token
  const [token, setToken] = useState(() => getStoredToken());

  // Stored user object from localStorage (only populated if token is present)
  const [user, setUser] = useState(() => {
    const storedToken = getStoredToken();
    if (!storedToken) return null;
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Global Auth Modal state accessible from Navbar, Profile, or anywhere
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    initialTab: 'login', // 'login' | 'register'
  });

  const isAuthenticated = Boolean(token && user);

  /**
   * Save user safely to localStorage and React state
   */
  const persistUser = useCallback((userData) => {
    if (userData) {
      setUser(userData);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        if (userData.avatarUrl) {
          localStorage.setItem('aspectt_user_avatar', userData.avatarUrl);
        }
      } catch (err) {
        console.error('Failed to save user in storage:', err);
      }
    } else {
      setUser(null);
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to remove user from storage:', err);
      }
    }
  }, []);

  /**
   * Open Auth Modal
   */
  const openAuthModal = useCallback((initialTab = 'login') => {
    setAuthModal({
      isOpen: true,
      initialTab: initialTab === 'register' ? 'register' : 'login',
    });
  }, []);

  /**
   * Close Auth Modal
   */
  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Fetch current user profile from backend to verify token freshness
   */
  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      return null;
    }

    try {
      const freshUser = await authApi.getProfile();
      if (freshUser && freshUser.id) {
        persistUser(freshUser);
        return freshUser;
      }
    } catch (err) {
      console.warn('Auth token verification / refresh warning:', err?.message || err);
      // If token expired or invalid (401), clean up
      if (err?.status === 401) {
        removeStoredToken();
        persistUser(null);
        setToken(null);
      }
    }
    return null;
  }, [persistUser]);

  // Initial load check
  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  /**
   * Login handler
   */
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const res = await authApi.login({ email, password });
        if (res?.token && res?.user) {
          setStoredToken(res.token);
          setToken(res.token);
          persistUser(res.user);
          closeAuthModal();
          return res;
        }
        throw new Error(res?.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [persistUser, closeAuthModal]
  );

  /**
   * Register handler
   */
  const register = useCallback(
    async (name, email, password, avatarUrl, otp) => {
      setLoading(true);
      try {
        const res = await authApi.register({ name, email, password, avatarUrl, otp });
        if (res?.token && res?.user) {
          setStoredToken(res.token);
          setToken(res.token);
          persistUser(res.user);
          closeAuthModal();
          return res;
        }
        throw new Error(res?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [persistUser, closeAuthModal]
  );

  /**
   * Immediate Logout handler
   * Clears token and user state immediately across all components without reload
   */
  const logout = useCallback(() => {
    try {
      authApi.logout();
    } catch (e) {
      console.warn('API logout error:', e);
    }

    // Clear all Aspectt auth keys from localStorage
    try {
      localStorage.removeItem('aspectt_token');
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('aspectt_user_profile');
      localStorage.removeItem('aspect_user_profile');
      localStorage.removeItem('aspectt_user_avatar');
      localStorage.removeItem('aspect_user_avatar');
      localStorage.removeItem('aspectt_watchlist');
      localStorage.removeItem('aspect_watchlist');
    } catch (e) {
      console.error('Storage cleanup error:', e);
    }

    // Reset reactive states immediately
    setToken(null);
    setUser(null);
    closeAuthModal();
  }, [closeAuthModal]);

  /**
   * Update User state locally and in storage (e.g. after editing profile)
   */
  const updateUser = useCallback(
    (updatedFields) => {
      setUser((prev) => {
        const next = { ...(prev || {}), ...updatedFields };
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

