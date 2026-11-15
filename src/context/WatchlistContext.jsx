import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AVATAR_OPTIONS, DEFAULT_AVATAR_URL } from '../data/avatars';
import { authApi, getStoredToken, normalizeMovie } from '../api/client';

export { AVATAR_OPTIONS, DEFAULT_AVATAR_URL };

const DEFAULT_PROFILE = {
  name: 'Alex Vance',
  email: 'alex@aspectt.com',
  phone: '+1 (555) 382-9014',
  avatar: AVATAR_OPTIONS[0],
  plan: 'Aspectt Ultra (4K UHD)',
  language: 'English (US)',
};

const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken()));

  // Watchlist IDs
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

  // Active user avatar state synced with localStorage key 'aspectt_user_avatar'
  const [userAvatar, setUserAvatar] = useState(() => {
    try {
      const savedAvatar =
        localStorage.getItem('aspectt_user_avatar') ||
        localStorage.getItem('aspect_user_avatar');
      if (savedAvatar) return savedAvatar;
      const savedProfile =
        localStorage.getItem('aspectt_user_profile') ||
        localStorage.getItem('aspect_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.avatar?.src) return parsed.avatar.src;
        if (typeof parsed.avatar === 'string') return parsed.avatar;
      }
      return DEFAULT_AVATAR_URL;
    } catch {
      return DEFAULT_AVATAR_URL;
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved =
        localStorage.getItem('aspectt_user_profile') ||
        localStorage.getItem('aspect_user_profile');
      const initialProfile = saved ? JSON.parse(saved) : DEFAULT_PROFILE;
      if (!initialProfile.avatar || !initialProfile.avatar.src) {
        initialProfile.avatar = AVATAR_OPTIONS[0];
      }
      return initialProfile;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Fetch live profile and watchlist from PostgreSQL if authenticated
  const syncWithBackend = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) return;

    try {
      const profile = await authApi.getProfile();
      if (profile) {
        setIsAuthenticated(true);
        const avatarObj =
          AVATAR_OPTIONS.find((a) => a.src === profile.avatarUrl) || {
            id: 'avatar-custom',
            name: profile.name,
            src: profile.avatarUrl || DEFAULT_AVATAR_URL,
            color: '#7E57C2',
          };

        setUserProfile((prev) => ({
          ...prev,
          name: profile.name,
          email: profile.email,
          avatar: avatarObj,
          plan: profile.subscriptionTier === 'pro' ? 'Aspectt Ultra (4K UHD)' : prev.plan,
        }));

        if (profile.avatarUrl) {
          setUserAvatar(profile.avatarUrl);
        }
      }
    } catch (err) {
      console.warn('Backend profile sync skipped:', err.message);
    }

    try {
      const liveWatchlist = await authApi.getWatchlist();
      if (Array.isArray(liveWatchlist)) {
        setWatchlistMovies(liveWatchlist);
        setWatchlist(liveWatchlist.map((m) => m.id));
      }
    } catch (err) {
      console.warn('Backend watchlist sync skipped:', err.message);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aspectt_watchlist', JSON.stringify(watchlist));
      localStorage.setItem('aspect_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  // Sync user profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aspectt_user_profile', JSON.stringify(userProfile));
      localStorage.setItem('aspect_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  // Sync active user avatar URL to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aspectt_user_avatar', userAvatar);
      localStorage.setItem('aspect_user_avatar', userAvatar);
    } catch (e) {
      console.error(e);
    }
  }, [userAvatar]);

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
    if (getStoredToken()) {
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

    setUserAvatar(avatarUrl);
    setUserProfile((prev) => ({
      ...prev,
      avatar: avatarObj,
    }));

    try {
      localStorage.setItem('aspectt_user_avatar', avatarUrl);
      localStorage.setItem('aspect_user_avatar', avatarUrl);
    } catch (e) {
      console.error(e);
    }

    // Persist to backend database
    if (getStoredToken()) {
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
      setUserAvatar(avatarUrl);
      try {
        localStorage.setItem('aspectt_user_avatar', avatarUrl);
        localStorage.setItem('aspect_user_avatar', avatarUrl);
      } catch (e) {
        console.error(e);
      }
    }

    setUserProfile((prev) => ({
      ...prev,
      ...newDetails,
    }));

    showToast('Profile information updated successfully');

    // Persist to backend database
    if (getStoredToken()) {
      try {
        await authApi.updateProfile({
          name: newDetails.name,
          avatarUrl,
          appLanguage: newDetails.language,
          subscriptionTier: newDetails.plan,
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
    const res = await authApi.login({ email, password });
    if (res?.token) {
      setToken(res.token);
      setIsAuthenticated(true);
      await syncWithBackend();
      showToast(`Welcome back, ${res.user?.name || 'Alex'}!`);
      return res;
    }
    throw new Error('Authentication failed');
  };

  /**
   * Register new user
   */
  const register = async (name, email, password, avatarUrl) => {
    const res = await authApi.register({ name, email, password, avatarUrl });
    if (res?.token) {
      setToken(res.token);
      setIsAuthenticated(true);
      await syncWithBackend();
      showToast(`Welcome to Aspectt, ${res.user?.name}!`);
      return res;
    }
    throw new Error('Registration failed');
  };

  /**
   * Logout user
   */
  const logout = () => {
    authApi.logout();
    setToken(null);
    setIsAuthenticated(false);
    setWatchlist([]);
    setWatchlistMovies([]);
    showToast('Logged out of Aspectt');
  };

  const isInWatchlist = (movieId) => watchlist.includes(movieId);

  return (
    <WatchlistContext.Provider
      value={{
        token,
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
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
