import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, subscriptionApi, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';
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

  // Live Subscription states
  const [subscription, setSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Global Auth Modal state accessible from Navbar, Profile, or anywhere
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    initialTab: 'login', // 'login' | 'register'
    message: '',
  });

  // Temporary pending playback state for post-login auto-launch
  const [pendingPlayback, setPendingPlaybackState] = useState(() => {
    try {
      const stored = sessionStorage.getItem('aspectt_pending_play');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setPendingPlayback = useCallback((movieOrId) => {
    setPendingPlaybackState(movieOrId);
    try {
      if (movieOrId) {
        sessionStorage.setItem('aspectt_pending_play', JSON.stringify(movieOrId));
      } else {
        sessionStorage.removeItem('aspectt_pending_play');
      }
    } catch (e) {
      console.warn('Failed to update pending playback storage:', e);
    }
  }, []);

  const clearPendingPlayback = useCallback(() => {
    setPendingPlaybackState(null);
    try {
      sessionStorage.removeItem('aspectt_pending_play');
    } catch (e) {
      console.warn('Failed to clear pending playback storage:', e);
    }
  }, []);

  const isAuthenticated = Boolean(token && user);

  // Active subscription check (unlocked only if active plan is present and unexpired)
  const isSubscribed = Boolean(
    isAuthenticated &&
      subscription &&
      subscription.status === 'ACTIVE' &&
      new Date(subscription.expiryDate) > new Date()
  );

  /**
   * Fetch current subscription status from backend
   */
  const refreshSubscription = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setSubscription(null);
      setSubscriptionHistory([]);
      return null;
    }

    try {
      setIsLoadingSubscription(true);
      const res = await subscriptionApi.getStatus();
      if (res?.success) {
        setSubscription(res.subscription || null);
        setSubscriptionHistory(Array.isArray(res.history) ? res.history : []);
        return res;
      }
    } catch (err) {
      console.warn('Subscription status check warning:', err?.message || err);
    } finally {
      setIsLoadingSubscription(false);
    }
    return null;
  }, []);

  /**
   * Activate a subscription plan (Monthly or Yearly)
   */
  const activateSubscription = useCallback(
    async (planName = 'MONTHLY') => {
      setLoading(true);
      try {
        const res = await subscriptionApi.activatePlan({ planName });
        if (res?.success) {
          if (res.subscription) {
            setSubscription(res.subscription);
          }
          if (res.historyItem) {
            setSubscriptionHistory((prev) => [res.historyItem, ...prev]);
          }
          await refreshSubscription();
          return res;
        }
        throw new Error(res?.message || 'Failed to activate plan.');
      } finally {
        setLoading(false);
      }
    },
    [refreshSubscription]
  );

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
   * Open Auth Modal with optional message
   */
  const openAuthModal = useCallback((initialTab = 'login', message = '') => {
    setAuthModal({
      isOpen: true,
      initialTab: initialTab === 'register' ? 'register' : 'login',
      message: message || '',
    });
  }, []);

  /**
   * Close Auth Modal
   */
  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, message: '' }));
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
      refreshSubscription();
    } else {
      setSubscription(null);
      setSubscriptionHistory([]);
    }
  }, [token, refreshUser, refreshSubscription]);

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
          // Fetch user's live subscription status (if any)
          refreshSubscription();
          return res;
        }
        throw new Error(res?.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [persistUser, closeAuthModal, refreshSubscription]
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
          setSubscription(null);
          setSubscriptionHistory([]);
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
   * Send Signup OTP via Brevo API
   */
  const sendOtp = useCallback(async ({ name, email, phone, password }) => {
    return await authApi.sendOtp({ name, email, phone, password });
  }, []);

  /**
   * Verify Signup OTP and create permanent User
   * Newly registered users do NOT receive active subscription automatically.
   */
  const verifyOtp = useCallback(
    async ({ email, otp, avatar }) => {
      setLoading(true);
      try {
        const res = await authApi.verifyOtp({ email, otp, avatar });
        if (res?.token && res?.user) {
          setStoredToken(res.token);
          setToken(res.token);
          persistUser(res.user);
          // New signups start with no active subscription
          setSubscription(null);
          setSubscriptionHistory([]);
          return res;
        }
        throw new Error(res?.message || 'Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [persistUser]
  );

  /**
   * Update avatar for active user
   */
  const setAuthAvatar = useCallback(
    async (avatar) => {
      try {
        const res = await authApi.updateAvatar(avatar);
        if (res?.user) {
          persistUser(res.user);
        }
        return res;
      } catch (err) {
        console.warn('Failed to update avatar:', err);
      }
    },
    [persistUser]
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
    setSubscription(null);
    setSubscriptionHistory([]);
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
        subscription,
        isSubscribed,
        subscriptionHistory,
        isLoadingSubscription,
        refreshSubscription,
        activateSubscription,
        login,
        register,
        sendOtp,
        verifyOtp,
        setAuthAvatar,
        logout,
        refreshUser,
        updateUser,
        authModal,
        openAuthModal,
        closeAuthModal,
        pendingPlayback,
        setPendingPlayback,
        clearPendingPlayback,
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

