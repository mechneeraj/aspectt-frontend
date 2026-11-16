import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AVATAR_OPTIONS, DEFAULT_AVATAR_URL } from '../data/avatars';
import { authApi, getStoredToken, normalizeMovie } from '../api/client';
import { useAuth } from './AuthContext';

export { AVATAR_OPTIONS, DEFAULT_AVATAR_URL };

const WatchlistContext = createContext(null);

export const WatchlistProvider = ({ children }) => {
  const {
    token,
    user,
    isAuthenticated,
    isSubscribed,
    login: authLogin,
    register: authRegister,
    logout: authLogout,
    refreshUser,
    updateUser: authUpdateUser,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  // Watchlist IDs state
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved =
        localStorage.getItem('aspectt_watchlist') ||
        localStorage.getItem('aspect_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Full movie objects for saved watchlist view
  const [watchlistMovies, setWatchlistMovies] = useState([]);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Compute reactive userProfile object from active authenticated user
  const userProfile = isAuthenticated && user
    ? {
        name: user.name || 'Aspectt Member',
        email: user.email || '',
        phone: user.phone || '',
        avatar:
          AVATAR_OPTIONS.find((a) => a.src === user.avatarUrl) || {
            id: 'avatar-user',
            name: user.name || 'User',
            src: user.avatarUrl || DEFAULT_AVATAR_URL,
            color: '#7E57C2',
          },
        plan:
          isSubscribed || user.subscriptionTier?.toLowerCase() === 'pro'
            ? 'Active Plan'
            : 'No Active Plan',
        language:
          user.appLanguage === 'en'
            ? 'English (US)'
            : user.appLanguage || 'English (US)',
      }
    : null;

  // Active user avatar URL synced with authenticated user state
  const userAvatar = user?.avatarUrl || userProfile?.avatar?.src || DEFAULT_AVATAR_URL;

  // Fetch live watchlist from PostgreSQL backend if authenticated
  const syncWithBackend = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken || !isAuthenticated) return;

    try {
      const liveWatchlist = await authApi.getWatchlist();
      if (Array.isArray(liveWatchlist)) {
        setWatchlistMovies(liveWatchlist);
        setWatchlist(liveWatchlist.map((m) => m.id));
      }
    } catch (err) {
      console.warn('Backend watchlist sync skipped:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend();
    } else {
      setWatchlistMovies([]);
    }
  }, [isAuthenticated, syncWithBackend]);

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aspectt_watchlist', JSON.stringify(watchlist));
      localStorage.setItem('aspect_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  /**
   * Toggle Watchlist: Calls POST /api/user/watchlist/:movieId if authenticated,
   * falling back to local state sync.
   */
  const toggleWatchlist = async (movieId, movieTitle = 'Film') => {
    const exists = watchlist.includes(movieId);

    // Optimistic UI update
    setWatchlist((prev) =>
      exists ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );

    if (exists) {
      setWatchlistMovies((prev) => prev.filter((m) => m.id !== movieId));
      showToast(`Removed "${movieTitle}" from Watchlist`);
    } else {
      showToast(`Added "${movieTitle}" to Watchlist`);
    }

    // Persist to PostgreSQL backend if authenticated
    if (getStoredToken() && isAuthenticated) {
      try {
        await authApi.toggleWatchlist(movieId);
        // Refresh full watchlist from backend
        const freshList = await authApi.getWatchlist();
        if (Array.isArray(freshList)) {
          setWatchlistMovies(freshList);
          setWatchlist(freshList.map((m) => m.id));
        }
      } catch (err) {
        console.warn('Backend toggleWatchlist error:', err.message);
      }
    }
  };

  /**
   * Immediate Avatar Update (real-time across Navbar and Profile page)
   * Persists changes to PostgreSQL via PATCH /api/user/profile
   */
  const updateUserAvatar = async (avatarInput) => {
    const avatarObj =
      typeof avatarInput === 'string'
        ? AVATAR_OPTIONS.find((a) => a.src === avatarInput) || {
            id: 'avatar-custom',
            name: 'Custom',
            src: avatarInput,
            color: '#7E57C2',
          }
        : avatarInput;

    const avatarUrl = avatarObj.src || avatarObj;

    // Update AuthContext user state
    authUpdateUser({ avatarUrl });

    // Persist to backend database if authenticated
    if (getStoredToken() && isAuthenticated) {
      try {
        await authApi.updateProfile({ avatarUrl });
      } catch (err) {
        console.warn('Backend avatar update skipped:', err.message);
      }
    }
  };

  /**
   * Update User Profile: Persists changes to PostgreSQL via PATCH /api/user/profile
   */
  const updateUserProfile = async (newDetails) => {
    let avatarUrl = userAvatar;

    if (newDetails.avatar) {
      const avatarObj =
        typeof newDetails.avatar === 'string'
          ? AVATAR_OPTIONS.find((a) => a.src === newDetails.avatar) || {
              id: 'avatar-custom',
              name: 'Custom',
              src: newDetails.avatar,
              color: '#7E57C2',
            }
          : newDetails.avatar;

      avatarUrl = avatarObj.src || avatarObj;
    }

    // Update in reactive AuthContext state
    authUpdateUser({
      name: newDetails.name || user?.name,
      avatarUrl,
      phone: newDetails.phone !== undefined ? newDetails.phone : user?.phone,
      appLanguage: newDetails.language === 'English (US)' ? 'en' : newDetails.language,
    });

    showToast('Profile information updated successfully');

    // Persist to backend database
    if (getStoredToken() && isAuthenticated) {
      try {
        await authApi.updateProfile({
          name: newDetails.name,
          phone: newDetails.phone,
          avatarUrl,
          appLanguage: newDetails.language === 'English (US)' ? 'en' : newDetails.language,
        });
      } catch (err) {
        console.warn('Backend profile update skipped:', err.message);
      }
    }
  };

  /**
   * Login user with email & password
   */
  const login = async (email, password) => {
    const res = await authLogin(email, password);
    await syncWithBackend();
    return res;
  };

  /**
   * Register new user
   */
  const register = async (name, email, password, avatarUrl, otp) => {
    const res = await authRegister(name, email, password, avatarUrl, otp);
    await syncWithBackend();
    return res;
  };

  /**
   * Logout user immediately
   */
  const logout = () => {
    authLogout();
    setWatchlist([]);
    setWatchlistMovies([]);
    showToast('Logged out of Aspectt');
  };

  const isInWatchlist = (movieId) => watchlist.includes(movieId);

  return (
    <WatchlistContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        register,
        logout,
        watchlist,
        watchlistMovies,
        toggleWatchlist,
        isInWatchlist,
        userAvatar,
        updateUserAvatar,
        userProfile,
        updateUserProfile,
        toastMessage,
        showToast,
        syncWithBackend,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
