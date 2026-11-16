import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import SubscriptionsOutlinedIcon from '@mui/icons-material/SubscriptionsOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import CopyrightOutlinedIcon from '@mui/icons-material/CopyrightOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useWatchlist, AVATAR_OPTIONS } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { movies } from '../data/movies';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isSubscribed, subscription, refreshSubscription, logout } = useAuth();
  const {
    watchlist,
    watchlistMovies,
    toggleWatchlist,
    userProfile,
    updateUserProfile,
    userAvatar,
    updateUserAvatar,
    showToast,
    login,
    register,
  } = useWatchlist();

  // Active interactive modal/panel state
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'subscription' | 'watchlist' | 'language' | 'about' | 'help' | 'logout' | 'auth' | null
  const [aboutTab, setAboutTab] = useState('about'); // 'about' | 'privacy' | 'terms'

  // Auth form state (Login & Registration)
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Profile edit form state
  const [editName, setEditName] = useState(userProfile?.name || user?.name || '');
  const [editEmail, setEditEmail] = useState(userProfile?.email || user?.email || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || user?.phone || '');
  const [selectedAvatar, setSelectedAvatar] = useState(
    () => AVATAR_OPTIONS.find((a) => a.src === userAvatar) || userProfile?.avatar || AVATAR_OPTIONS[0]
  );

  // Synchronize profile form fields when auth state or user profile changes
  useEffect(() => {
    if (userProfile || user) {
      setEditName(userProfile?.name || user?.name || '');
      setEditEmail(userProfile?.email || user?.email || '');
      setEditPhone(userProfile?.phone || user?.phone || '');
      const avatar = AVATAR_OPTIONS.find((a) => a.src === userAvatar) || userProfile?.avatar || AVATAR_OPTIONS[0];
      setSelectedAvatar(avatar);
    }
  }, [userProfile, user, userAvatar]);

  // Ensure live subscription details are up-to-date
  useEffect(() => {
    if (isAuthenticated && refreshSubscription) {
      refreshSubscription();
    }
  }, [isAuthenticated, refreshSubscription]);

  // Calculate days left for active subscription
  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    try {
      const diff = new Date(expiryDate) - new Date();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return null;
    }
  };

  const getPlanDisplay = () => {
    if (!isSubscribed) return 'No Active Plan';
    const planName = subscription?.planName === 'YEARLY' ? 'Yearly Plan' : 'Monthly Plan';
    const days = getDaysLeft(subscription?.expiryDate);
    if (days !== null) {
      return `${planName} (${days} ${days === 1 ? 'day' : 'days'} left)`;
    }
    return planName;
  };

  const savedMovies =
    watchlistMovies && watchlistMovies.length > 0
      ? watchlistMovies
      : movies.filter((m) => watchlist.includes(m.id));

  // Avatar scroll tracking for PC arrow navigation
  const avatarScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkAvatarScroll = () => {
    const el = avatarScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    if (activeModal === 'profile') {
      const timer = setTimeout(checkAvatarScroll, 120);
      return () => clearTimeout(timer);
    }
  }, [activeModal]);

  const scrollAvatars = (direction) => {
    const el = avatarScrollRef.current;
    if (!el) return;
    const scrollAmount = 180;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkAvatarScroll, 250);
  };

  const openEditProfile = () => {
    setEditName(userProfile?.name || user?.name || '');
    setEditEmail(userProfile?.email || user?.email || '');
    setEditPhone(userProfile?.phone || user?.phone || '');
    const current = AVATAR_OPTIONS.find((a) => a.src === userAvatar) || userProfile?.avatar || AVATAR_OPTIONS[0];
    setSelectedAvatar(current);
    setActiveModal('profile');
  };

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    updateUserAvatar(avatar);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Please provide your full name');
      return;
    }
    if (!editEmail.trim()) {
      showToast('Please provide a valid email');
      return;
    }

    updateUserProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      avatar: selectedAvatar,
    });
    setActiveModal(null);
  };

  const handleLanguageChange = (lang) => {
    updateUserProfile({ language: lang });
    setActiveModal(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await login(authEmail.trim(), authPassword);
      setActiveModal(null);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim() || !authPassword) {
      setAuthError('Please fill out all required fields.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await register(authName.trim(), authEmail.trim(), authPassword);
      setActiveModal(null);
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setAuthEmail('alex@aspectt.com');
    setAuthPassword('Password123!');
    setAuthTab('login');
    setAuthError('');
  };

  const handleLogout = () => {
    logout();
    setActiveModal(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#1E2024] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        {/* User Header Section Card */}
        {isAuthenticated && (userProfile || user) ? (
          <div className="bg-[#282B30] border border-[#353941] rounded-xl p-6 sm:p-8 mb-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* User Avatar with Edit Trigger */}
              <div className="relative group cursor-pointer" onClick={openEditProfile} title="Change Profile Avatar">
                <Avatar
                  src={userAvatar || userProfile?.avatar?.src || user?.avatarUrl}
                  alt={userProfile?.name || user?.name}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: userProfile?.avatar?.color || '#7E57C2',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    borderRadius: '14px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    border: '2px solid #353941',
                  }}
                >
                  {(userProfile?.name || user?.name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <div className="absolute inset-0 bg-black/60 rounded-[14px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <EditOutlinedIcon fontSize="small" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                        {userProfile?.name || user?.name || 'Aspectt Member'}
                      </h1>
                      {/* Mobile: Pencil icon right next to the name */}
                      <button
                        onClick={openEditProfile}
                        className="sm:hidden p-1 text-[#B8BCC4] hover:text-[#7E57C2] transition-colors cursor-pointer"
                        title="Edit Profile Details"
                        aria-label="Edit Profile Details"
                      >
                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                      </button>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#1E2024] border border-[#353941] text-[#7E57C2]">
                        {isSubscribed ? `${subscription?.planName || 'ACTIVE'} MEMBER` : 'FREE GUEST'}
                      </span>
                    </div>
                    {/* Mobile: Plan name directly under the name */}
                    <div className="sm:hidden text-xs text-[#B8BCC4] mt-1 font-medium">
                      <span className="text-[#8A8F99]">Plan: </span>
                      <strong className={isSubscribed ? 'text-white' : 'text-[#8A8F99]'}>
                        {getPlanDisplay()}
                      </strong>
                      {!isSubscribed && (
                        <button
                          onClick={() => navigate('/subscription')}
                          className="text-[#7E57C2] hover:text-[#9575CD] font-medium text-xs underline cursor-pointer ml-1.5"
                        >
                          Subscribe
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PC and Tablet: "Edit Details" button (hidden on mobile) */}
                  <button
                    onClick={openEditProfile}
                    className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2024] hover:bg-[#353941] border border-[#353941] text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <EditOutlinedIcon sx={{ fontSize: 14 }} />
                    <span>Edit Details</span>
                  </button>
                </div>

                {/* Contact info: Email & Phone */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#B8BCC4] font-mono">
                    <EmailOutlinedIcon sx={{ fontSize: 14 }} className="text-[#8A8F99]" />
                    <span className="truncate">{userProfile?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#B8BCC4] font-mono">
                    <PhoneAndroidOutlinedIcon sx={{ fontSize: 14 }} className="text-[#8A8F99]" />
                    <span>{user?.phone || userProfile?.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* PC and Tablet: Plan row at the bottom (under mobile number) */}
                <div className="hidden sm:flex items-center justify-start gap-2 mt-3 text-xs text-[#8A8F99] pt-2 border-t border-[#353941]/60">
                  <span>
                    Plan:{' '}
                    <strong className={isSubscribed ? 'text-white' : 'text-[#8A8F99]'}>
                      {getPlanDisplay()}
                    </strong>
                  </span>
                  {!isSubscribed && (
                    <button
                      onClick={() => navigate('/subscription')}
                      className="text-[#7E57C2] hover:text-[#9575CD] font-medium text-xs underline cursor-pointer ml-1"
                    >
                      Subscribe
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#282B30] border border-[#353941] rounded-xl p-6 sm:p-8 mb-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-3">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#353941',
                  color: '#B8BCC4',
                  fontSize: '1.25rem',
                }}
              >
                ?
              </Avatar>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Aspectt Cinema Account
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8F99] max-w-sm mx-auto mt-1 mb-5">
              Sign in or create an account to access customized playback settings, watchlist synchronization, and member perks.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                  setActiveModal('auth');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#7E57C2] hover:bg-[#6D48B5] text-white text-xs font-semibold shadow-md shadow-[#7E57C2]/20 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                  setActiveModal('auth');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1E2024] hover:bg-[#353941] border border-[#353941] text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Menu Items List Card */}
        <div className="bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden divide-y divide-[#353941]">
          
          {/* 1. Subscription Details */}
          <button
            onClick={() => navigate('/subscription')}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                <SubscriptionsOutlinedIcon fontSize="small" />
              </div>
              <span className="text-sm font-semibold text-white">Subscription & Plans</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8BCC4]">
              <span className={isSubscribed ? 'text-emerald-400 font-medium' : 'text-[#8A8F99]'}>
                {isSubscribed ? 'Active' : 'No Active Plan'}
              </span>
              <ChevronRightIcon fontSize="small" className="text-[#8A8F99]" />
            </div>
          </button>

          {/* 2. Watchlist */}
          <button
            onClick={() => setActiveModal('watchlist')}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                <BookmarkBorderOutlinedIcon fontSize="small" />
              </div>
              <span className="text-sm font-semibold text-white">Watchlist</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8BCC4]">
              <span className="px-2 py-0.5 rounded bg-[#1E2024] border border-[#353941] text-white font-mono">
                {watchlist.length}
              </span>
              <ChevronRightIcon fontSize="small" className="text-[#8A8F99]" />
            </div>
          </button>

          {/* 3. App Language */}
          <button
            onClick={() => setActiveModal('language')}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                <TranslateOutlinedIcon fontSize="small" />
              </div>
              <span className="text-sm font-semibold text-white">App Language</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8BCC4]">
              <span>{userProfile?.language || 'English (US)'}</span>
              <ChevronRightIcon fontSize="small" className="text-[#8A8F99]" />
            </div>
          </button>

          {/* 4. About */}
          <button
            onClick={() => {
              setAboutTab('about');
              setActiveModal('about');
            }}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                <InfoOutlinedIcon fontSize="small" />
              </div>
              <span className="text-sm font-semibold text-white">About</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8BCC4]">
              <span>v1.4.0</span>
              <ChevronRightIcon fontSize="small" className="text-[#8A8F99]" />
            </div>
          </button>

          {/* 5. Support and Copyright Claim */}
          <button
            onClick={() => setActiveModal('help')}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                <SupportAgentOutlinedIcon fontSize="small" />
              </div>
              <span className="text-sm font-semibold text-white">Support and Copyright Claim</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#B8BCC4]">
              <ChevronRightIcon fontSize="small" className="text-[#8A8F99]" />
            </div>
          </button>

          {/* 7. Auth (Sign In or Logout) */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#332024] transition-colors text-left group cursor-pointer border-t border-[#4A282D]"
              title="Logout from Aspectt"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#24171A] border border-[#4A282D] flex items-center justify-center text-[#E57373] group-hover:text-[#FF8A80] transition-colors">
                  <LogoutOutlinedIcon fontSize="small" />
                </div>
                <span className="text-sm font-semibold text-[#E57373] group-hover:text-[#FF8A80] transition-colors">
                  Logout
                </span>
              </div>
              <div className="text-xs text-[#B57C7C]">Sign out</div>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthError('');
                setActiveModal('auth');
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#353941] transition-colors text-left group cursor-pointer border-t border-[#353941]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] group-hover:text-white transition-colors">
                  <LogoutOutlinedIcon fontSize="small" className="rotate-180" />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-[#7E57C2] transition-colors">
                  Sign In / Register
                </span>
              </div>
              <div className="text-xs text-[#7E57C2] font-medium">Connect account</div>
            </button>
          )}

        </div>
      </div>

      {/* --- Interactive Modals --- */}

      {/* 1. Edit Profile Modal (Name, Email, Mobile Number, Avatar Picker) */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-[200] overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn flex items-center justify-center">
          <div className="w-full max-w-lg bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto">
            {/* Modal Header (pinned at top) */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#353941] bg-[#222428] flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">Edit Profile Details</h3>
                <p className="text-xs text-[#8A8F99]">Update your avatar, personal info, and contact details</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {/* Modal Form with Scrollable Content Body and Pinned Action Footer */}
            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Vertically scrollable form body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                {/* Avatar Selector - Horizontally scrollable with 10% peek visibility on the hidden avatar */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-2">
                    Choose Avatar
                  </label>
                  
                  <div className="relative w-full group">
                    {/* PC Only: Left Arrow Button (visible when scrolled past 1st avatar) */}
                    {canScrollLeft && (
                      <button
                        type="button"
                        onClick={() => scrollAvatars('left')}
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#1E2024]/95 hover:bg-[#353941] text-white border border-[#353941] items-center justify-center shadow-lg transition-all cursor-pointer"
                        title="Scroll left"
                        aria-label="Scroll avatars left"
                      >
                        <ChevronLeftIcon fontSize="small" />
                      </button>
                    )}

                    <div
                      ref={avatarScrollRef}
                      onScroll={checkAvatarScroll}
                      className="flex items-center gap-3.5 sm:gap-4 py-2 px-1 overflow-x-auto no-scrollbar scroll-smooth"
                      style={{
                        WebkitMaskImage: canScrollLeft && canScrollRight
                          ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, black 8%, black 80%, rgba(0,0,0,0.1) 95%, transparent 100%)'
                          : canScrollLeft && !canScrollRight
                          ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, black 8%, black 100%)'
                          : 'linear-gradient(to right, black 0%, black 80%, rgba(0, 0, 0, 0.10) 95%, transparent 100%)',
                        maskImage: canScrollLeft && canScrollRight
                          ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, black 8%, black 80%, rgba(0,0,0,0.1) 95%, transparent 100%)'
                          : canScrollLeft && !canScrollRight
                          ? 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 2%, black 8%, black 100%)'
                          : 'linear-gradient(to right, black 0%, black 80%, rgba(0, 0, 0, 0.10) 95%, transparent 100%)',
                      }}
                    >
                      {AVATAR_OPTIONS.map((avatar) => {
                        const isSelected =
                          selectedAvatar?.id === avatar.id ||
                          selectedAvatar?.src === avatar.src ||
                          userAvatar === avatar.src;
                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => handleSelectAvatar(avatar)}
                            className="group relative flex-shrink-0 flex items-center justify-center p-1 rounded-full transition-all cursor-pointer focus:outline-none bg-transparent"
                            title={`${avatar.name} (${avatar.style || 'avatar'})`}
                            aria-label={`Select ${avatar.name} avatar`}
                          >
                            <div className="relative">
                              <Avatar
                                src={avatar.src}
                                alt={avatar.name}
                                sx={{
                                  width: 54,
                                  height: 54,
                                  bgcolor: 'transparent',
                                  borderRadius: '50%',
                                  border: isSelected ? '3px solid #7E57C2' : '2px solid #353941',
                                  boxShadow: isSelected ? '0 0 0 2px rgba(126, 87, 194, 0.4)' : 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                className={isSelected ? 'scale-105' : 'group-hover:scale-105'}
                              >
                                {avatar.name.charAt(0)}
                              </Avatar>
                              {isSelected && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#7E57C2] text-white flex items-center justify-center shadow-md">
                                  <CheckIcon sx={{ fontSize: 11 }} />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* PC Only: Right Arrow Button (visible until last avatar is visible) */}
                    {canScrollRight && (
                      <button
                        type="button"
                        onClick={() => scrollAvatars('right')}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#1E2024]/95 hover:bg-[#353941] text-white border border-[#353941] items-center justify-center shadow-lg transition-all cursor-pointer"
                        title="Scroll right"
                        aria-label="Scroll avatars right"
                      >
                        <ChevronRightIcon fontSize="small" />
                      </button>
                    )}
                  </div>

                  {/* Attribution Credit */}
                  <p className="text-[11px] text-[#8A8F99] mt-2.5 leading-relaxed">
                    Avatars provided by DiceBear — illustrated by Micah Lanier (CC BY 4.0) &amp; Lisa Wischofsky (CC0).
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      placeholder="e.g. alex.morgan@aspectt.stream"
                      className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[#8A8F99] mt-1">
                    Used for account recovery and two-factor authentication notifications.
                  </p>
                </div>
              </div>

              {/* Modal Action Buttons (Pinned sticky at bottom of modal) */}
              <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#353941] bg-[#222428] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-[#B8BCC4] hover:text-white border border-[#353941] hover:bg-[#353941]/50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide shadow-md transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Subscription Details Modal */}
      {activeModal === 'subscription' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#353941] bg-[#222428]">
              <h3 className="text-base font-bold text-white">Subscription Details</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941]"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-[#7E57C2] font-semibold">
                    {isSubscribed ? 'Active Plan' : 'Plan Status'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#353941] text-white font-mono">
                    {isSubscribed
                      ? subscription?.expiryDate
                        ? `${getDaysLeft(subscription.expiryDate)} days left`
                        : 'Active'
                      : 'Free'}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {getPlanDisplay()}
                </h4>
                <p className="text-xs text-[#B8BCC4] mt-1">
                  {isSubscribed && (subscription?.expiryDate || subscription?.expiresAt)
                    ? `Next renewal / expiration: ${new Date(subscription.expiryDate || subscription.expiresAt).toLocaleDateString()}`
                    : 'Subscribe to unlock the full cinema catalog'}
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#B8BCC4]">
                <div className="flex justify-between py-1 border-b border-[#353941]">
                  <span>Resolution</span>
                  <span className="text-white font-medium">1080p FHD &amp; 4K UHD</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#353941]">
                  <span>Concurrent Screens</span>
                  <span className="text-white font-medium">4 simultaneous</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#353941]">
                  <span>Audio Quality</span>
                  <span className="text-white font-medium">Lossless Stereo &amp; 5.1 Surround</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Ad Experience</span>
                  <span className="text-white font-medium">100% Ad-Free Cinema Stream</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    navigate('/subscription');
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#7E57C2] hover:bg-[#6C47AF] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  {isSubscribed ? 'Manage Subscription & Invoices' : 'View Subscription Plans'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Watchlist Modal */}
      {activeModal === 'watchlist' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#353941] bg-[#222428]">
              <h3 className="text-base font-bold text-white">
                Saved Watchlist ({savedMovies.length})
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941]"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {savedMovies.length > 0 ? (
                savedMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-3 bg-[#1E2024] border border-[#353941] rounded-lg hover:border-[#454A54] transition-colors"
                  >
                    <div
                      onClick={() => {
                        setActiveModal(null);
                        navigate(`/movie/${movie.id}`);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <img
                        src={movie.posterUrl || movie.poster}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-md bg-[#282B30] border border-[#353941]"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate hover:text-[#7E57C2] transition-colors">
                          {movie.title}
                        </h4>
                        <span className="text-xs text-[#B8BCC4]">
                          {movie.year || movie.releaseYear} • {movie.genres?.[0] || 'Curated'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleWatchlist(movie.id, movie.title)}
                      className="text-[#B8BCC4] hover:text-red-400 p-2 rounded hover:bg-[#282B30] transition-colors ml-2 cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#B8BCC4] text-sm">
                  Your watchlist is currently empty. Explore titles to add films.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#353941] bg-[#222428] flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/explore');
                }}
                className="px-4 py-2 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide cursor-pointer"
              >
                Explore More Titles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. App Language Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#353941] bg-[#222428]">
              <h3 className="text-base font-bold text-white">App Language</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941]"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[
                'English (US)',
                'English (UK)',
                'Español (Latinoamérica)',
                'Français',
                'Deutsch',
                '日本語',
                'Italiano',
              ].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    userProfile?.language === lang
                      ? 'bg-[#1E2024] border-[#7E57C2] text-white'
                      : 'bg-[#1E2024] border-[#353941] text-[#B8BCC4] hover:text-white hover:border-[#454A54]'
                  }`}
                >
                  <span>{lang}</span>
                  {userProfile?.language === lang && (
                    <CheckIcon fontSize="small" className="text-[#7E57C2]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. About Modal with Top 3 Buttons: About, Privacy Policy, Terms and Conditions */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#353941] bg-[#222428]">
              <h3 className="text-base font-bold text-white">
                {aboutTab === 'about' && 'About Aspectt'}
                {aboutTab === 'privacy' && 'Privacy Policy'}
                {aboutTab === 'terms' && 'Terms and Conditions'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941]"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {/* Three Buttons at Top */}
            <div className="p-3 border-b border-[#353941] bg-[#1E2024]/60">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1E2024] border border-[#353941] rounded-lg">
                <button
                  type="button"
                  onClick={() => setAboutTab('about')}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-md transition-all cursor-pointer truncate ${
                    aboutTab === 'about'
                      ? 'bg-[#7E57C2] text-white shadow-sm'
                      : 'text-[#B8BCC4] hover:text-white hover:bg-[#282B30]'
                  }`}
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => setAboutTab('privacy')}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-md transition-all cursor-pointer truncate ${
                    aboutTab === 'privacy'
                      ? 'bg-[#7E57C2] text-white shadow-sm'
                      : 'text-[#B8BCC4] hover:text-white hover:bg-[#282B30]'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setAboutTab('terms')}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-md transition-all cursor-pointer truncate ${
                    aboutTab === 'terms'
                      ? 'bg-[#7E57C2] text-white shadow-sm'
                      : 'text-[#B8BCC4] hover:text-white hover:bg-[#282B30]'
                  }`}
                >
                  Terms and Conditions
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#B8BCC4] leading-relaxed flex-1">
              {/* 1. About Tab Content */}
              {aboutTab === 'about' && (
                <div className="space-y-4 text-xs text-[#B8BCC4] leading-relaxed">
                  <div className="pb-3 border-b border-[#353941]">
                    <h4 className="text-base font-extrabold text-white tracking-tight">
                      Every Frame Has a Perspective.
                    </h4>
                    <p className="text-xs text-[#7E57C2] font-semibold mt-0.5">
                      Curated Independent Cinema
                    </p>
                  </div>

                  <p className="text-[#EDEDED] leading-relaxed">
                    Aspectt is a curated streaming home dedicated to meaningful storytelling, bold filmmaking, and cinema that stays with you long after the credits roll.
                  </p>

                  <p className="leading-relaxed">
                    We believe great stories deserve a stage where they can truly be experienced. Every short film, documentary, and independent feature in our catalog is thoughtfully handpicked by people who deeply care about the craft of cinema.
                  </p>

                  <div className="pt-2 border-t border-[#353941]">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-2.5">
                      What We Stand For
                    </h5>
                    <div className="space-y-2.5">
                      <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3">
                        <strong className="text-white font-semibold block mb-0.5">
                          Thoughtful Curation
                        </strong>
                        <span className="text-[#8A8F99]">
                          A carefully selected library of festival gems, independent voices, and untold stories from India and around the world.
                        </span>
                      </div>

                      <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3">
                        <strong className="text-white font-semibold block mb-0.5">
                          Uninterrupted Viewing
                        </strong>
                        <span className="text-[#8A8F99]">
                          Once you press play, the story belongs entirely to you—no mid-roll interruptions, just pure cinema from start to finish.
                        </span>
                      </div>

                      <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3">
                        <strong className="text-white font-semibold block mb-0.5">
                          Filmmakers First
                        </strong>
                        <span className="text-[#8A8F99]">
                          Aspectt is built to empower independent creators. Filmmakers retain 100% ownership of their work through transparent, non-exclusive partnerships and direct audience insights.
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="pt-2 border-t border-[#353941] text-[#EDEDED] leading-relaxed">
                    Whether you are a cinephile searching for your next unforgettable watch or a filmmaker looking for a home that respects your vision—<strong className="text-white">welcome to Aspectt</strong>.
                  </p>

                  <div className="p-3 bg-[#7E57C2]/15 border border-[#7E57C2]/40 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-medium text-xs">
                        Have a film to share?
                      </p>
                      <p className="text-[11px] text-[#B8BCC4]">
                        Submit your work and become part of our growing catalog.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        navigate('/#screener-submission');
                      }}
                      className="px-3 py-1.5 bg-[#7E57C2] hover:bg-[#6D48B5] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      Submit Film
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Privacy Policy Tab Content */}
              {aboutTab === 'privacy' && (
                <div className="space-y-4 text-xs text-[#B8BCC4] leading-relaxed">
                  <div className="pb-3 border-b border-[#353941]">
                    <h4 className="text-base font-bold text-white">Privacy Policy</h4>
                    <p className="text-[#8A8F99] mt-0.5 text-[11px] font-mono">Last Updated: November 2026</p>
                  </div>

                  <p className="text-[#EDEDED]">
                    Welcome to Aspectt. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you browse our website, create an account, stream content, or submit films on Aspectt.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <h5 className="font-semibold text-white mb-1.5">1. Information We Collect</h5>
                      <p className="mb-2">When you use Aspectt, we may collect the following information:</p>
                      <ul className="space-y-1.5 pl-3 border-l-2 border-[#7E57C2]/50">
                        <li>
                          <strong className="text-white">Account Information:</strong> Your name, email address, mobile number, encrypted password, and chosen profile avatar when you register or verify your account via One-Time Password (OTP).
                        </li>
                        <li>
                          <strong className="text-white">Filmmaker Submission Data:</strong> If you submit a film, we collect your contact details, film metadata, screener links, and related project information.
                        </li>
                        <li>
                          <strong className="text-white">Usage & Streaming Data:</strong> Basic technical logs such as watch activity, playback quality preferences, device/browser type, and IP address to maintain streaming performance and provide transparent watch-time insights to creators.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1.5">2. How We Use Your Information</h5>
                      <p className="mb-1.5">We use the collected information strictly to:</p>
                      <ul className="space-y-1 list-disc list-inside text-[#B8BCC4]">
                        <li>Create, verify, and secure your Aspectt account (including sending OTP verification emails).</li>
                        <li>Provide smooth, uninterrupted high-definition video playback and personalized profile features.</li>
                        <li>Review filmmaker submissions and share aggregated watch-time analytics with respective creators.</li>
                        <li>Maintain platform security, prevent unauthorized access to video streams, and improve user experience.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">3. Advertising & Display Placements</h5>
                      <p>
                        While we do not interrupt film playback with mid-roll advertisements, Aspectt may display non-intrusive advertisements or sponsored placements while browsing pages on the platform. Third-party ad partners, if introduced, may use standard cookies or non-personally identifiable browsing data to serve relevant display ads. We never sell your personal contact details (such as your email address or mobile number) to third parties.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">4. Data Storage & Third-Party Services</h5>
                      <p>
                        To operate our streaming and authentication infrastructure, we rely on trusted third-party service providers for database hosting, video delivery (CDN), and transactional email delivery. Your passwords are stored in encrypted (hashed) form, and video streams are protected against unauthorized access.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">5. Cookies & Local Storage</h5>
                      <p>
                        Aspectt uses browser localStorage and essential cookies to keep you signed in, remember your selected avatar, and preserve your playback preferences across sessions. You can clear your browser storage at any time, though doing so will sign you out of your account.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">6. Your Rights & Account Control</h5>
                      <p>
                        You may view or update your profile details on your Profile page, or request deletion of your account and associated personal data by contacting us.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">7. Changes to This Privacy Policy</h5>
                      <p>
                        Aspectt reserves the right to update, modify, or replace any part of this Privacy Policy at any time without any prior notice. Any changes will take effect immediately upon being posted on this page. Your continued use of the platform following the posting of updates constitutes your acceptance of the revised policy.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#353941]">
                      <h5 className="font-semibold text-white mb-1">8. Contact Us</h5>
                      <p>
                        If you have any questions regarding this Privacy Policy or your data, please reach out to us through the official contact details provided on the Aspectt website.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Terms and Conditions Tab Content */}
              {aboutTab === 'terms' && (
                <div className="space-y-4 text-xs text-[#B8BCC4] leading-relaxed">
                  <div className="pb-3 border-b border-[#353941]">
                    <h4 className="text-base font-bold text-white">Terms and Conditions</h4>
                    <p className="text-[#8A8F99] mt-0.5 text-[11px] font-mono">Last Updated: November 2026</p>
                  </div>

                  <p className="text-[#EDEDED]">
                    Welcome to Aspectt. By accessing, browsing, creating an account, streaming content, or submitting films on our website, you agree to comply with and be bound by the following Terms and Conditions. If you do not agree with any part of these terms, please refrain from using the platform.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <h5 className="font-semibold text-white mb-1.5">1. Eligibility & Account Registration</h5>
                      <ul className="space-y-1.5 pl-3 border-l-2 border-[#7E57C2]/50">
                        <li>
                          <strong className="text-white">Account Requirement:</strong> While visitors may browse the public catalog, creating a verified Aspectt account (via One-Time Password authentication) is required to stream full films and access personalized features.
                        </li>
                        <li>
                          <strong className="text-white">Accurate Information:</strong> You agree to provide accurate and complete information (name, email address, and mobile number) during registration and to keep your login credentials confidential.
                        </li>
                        <li>
                          <strong className="text-white">Account Responsibility:</strong> You are responsible for all activity that occurs under your account. Sharing accounts publicly or bypassing authentication controls is strictly prohibited.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1.5">2. License to Stream & Content Restrictions</h5>
                      <p className="mb-2">
                        <strong className="text-white">Personal, Non-Commercial Use:</strong> Aspectt grants you a limited, revocable, non-exclusive, and non-transferable license to stream films on the platform solely for personal, non-commercial viewing.
                      </p>
                      <p className="mb-1.5">
                        <strong className="text-white">Strict Anti-Piracy & Stream Protection:</strong> All films, trailers, artwork, audio, and streaming URLs on Aspectt are protected by copyright and technical access controls. You agree not to:
                      </p>
                      <ul className="space-y-1 list-disc list-inside text-[#B8BCC4] pl-1">
                        <li>Download, rip, screen-record, redistribute, or publicly exhibit any content from Aspectt.</li>
                        <li>Inspect, extract, share, or hotlink protected video stream URLs (.m3u8 or media segments) outside the official Aspectt player.</li>
                        <li>Circumvent, disable, or tamper with any security or authentication mechanisms on the platform.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1.5">3. Filmmaker Submissions & Content Ownership</h5>
                      <ul className="space-y-1.5 pl-3 border-l-2 border-[#7E57C2]/50">
                        <li>
                          <strong className="text-white">100% Creator Ownership:</strong> Filmmakers who submit their work to Aspectt retain 100% ownership and copyright of their films.
                        </li>
                        <li>
                          <strong className="text-white">Non-Exclusive Streaming Grant:</strong> By submitting a film and approving it for publication on Aspectt, the filmmaker grants Aspectt a non-exclusive, worldwide, royalty-free right to host, stream, promote (using trailers, stills, and metadata), and display the film on the platform until removed by mutual agreement or written takedown request.
                        </li>
                        <li>
                          <strong className="text-white">Creator Warranties:</strong> Filmmakers represent and warrant that they hold all necessary rights, music licenses, and clearances for their submitted work and that it does not infringe upon any third-party intellectual property or legal rights.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">4. Platform Experience & Browsing Placements</h5>
                      <p>
                        Aspectt provides uninterrupted film playback without mid-roll advertisements. However, Aspectt reserves the right to display non-intrusive sponsored placements or advertisements across browsing pages on the website.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">5. Suspension & Termination</h5>
                      <p>
                        Aspectt reserves the right to suspend or permanently terminate any user account, without prior notice, if we detect unauthorized stream access, piracy, abusive behavior, or any violation of these Terms and Conditions.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">6. Disclaimer & Limitation of Liability</h5>
                      <p className="mb-1.5">
                        Aspectt is provided on an "as is" and "as available" basis. While we strive for uninterrupted high-definition streaming, we do not guarantee that the platform will always be error-free or uninterrupted due to network or third-party server factors.
                      </p>
                      <p>
                        To the fullest extent permitted by law, Aspectt shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">7. Governing Law</h5>
                      <p>
                        These Terms and Conditions shall be governed by and construed in accordance with the laws of India, and any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in India.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold text-white mb-1">8. Changes to These Terms</h5>
                      <p>
                        Aspectt reserves the right to update, modify, or replace any part of these Terms and Conditions at any time without any prior notice. Any revisions take effect immediately upon being posted on this page. Your continued use of the platform after updates are posted constitutes your acceptance of the revised Terms and Conditions.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#353941]">
                      <h5 className="font-semibold text-white mb-1">9. Contact Us</h5>
                      <p>
                        For any questions regarding these Terms and Conditions, film submissions, or copyright inquiries, please reach out through the official contact channels listed on the Aspectt website.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Support and Copyright Claim Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#353941] bg-[#222428]">
              <h3 className="text-base font-bold text-white">Support and Copyright Claim</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941]"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs text-[#B8BCC4] overflow-y-auto">
              {/* Server Status */}
              <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Streaming Servers: All Systems Operational
                </div>
                <span className="text-[#8A8F99]">Latency: 18ms • CDN Edge Node active</span>
              </div>

              {/* Support Button */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  showToast('Support ticket #ASP-8849 created. We will email you.');
                }}
                className="w-full py-2.5 rounded-lg bg-[#1E2024] border border-[#353941] hover:border-[#454A54] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Contact Support Desk
              </button>

              {/* Copyright & DMCA Section */}
              <div className="pt-3 border-t border-[#353941] space-y-2.5">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CopyrightOutlinedIcon fontSize="small" className="text-[#7E57C2]" />
                  <span>Copyright & Content Claim</span>
                </div>
                <p className="text-[#8A8F99] leading-relaxed">
                  Aspectt adheres to international intellectual property laws and DMCA standards. If you believe your copyrighted title or visual material is being displayed without authorization, submit a takedown request to our designated legal team.
                </p>
                <div className="p-2.5 rounded bg-[#1E2024] border border-[#353941] text-[11px] font-mono text-[#B8BCC4]">
                  Legal Inquiries: <span className="text-white">copyright@aspectt.stream</span>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    showToast('Copyright claim submitted to legal@aspectt.stream. Case ID: #CPR-1042');
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-md"
                >
                  File Copyright Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Logout Confirmation Modal */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#282B30] border border-[#4A282D] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#24171A] border border-[#4A282D] flex items-center justify-center text-[#E57373]">
                <LogoutOutlinedIcon fontSize="medium" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Sign Out of Aspectt?</h3>
              <p className="text-xs text-[#B8BCC4] mb-5 leading-relaxed">
                You will be redirected to the home screen. Your watchlist and preferences will remain saved on this device.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-[#B8BCC4] hover:text-white border border-[#353941] bg-[#1E2024] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-[#D32F2F] hover:bg-[#C62828] transition-colors cursor-pointer"
                >
                  Confirm Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Sign In / Register Modal (Live PostgreSQL Auth) */}
      {activeModal === 'auth' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#353941] bg-[#222428]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {authTab === 'login' ? 'Sign In to Aspectt' : 'Create Aspectt Account'}
                </h3>
                <p className="text-xs text-[#8A8F99]">
                  {authTab === 'login'
                    ? 'Access your curated cinema watchlist & settings'
                    : 'Join the sanctuary for independent auteur cinema'}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#B8BCC4] hover:text-white p-1 rounded-md hover:bg-[#353941] transition-colors cursor-pointer"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#353941] bg-[#1E2024]">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                }}
                className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 cursor-pointer ${
                  authTab === 'login'
                    ? 'text-white border-[#7E57C2] bg-[#282B30]'
                    : 'text-[#8A8F99] border-transparent hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
                className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 cursor-pointer ${
                  authTab === 'register'
                    ? 'text-white border-[#7E57C2] bg-[#282B30]'
                    : 'text-[#8A8F99] border-transparent hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Demo Helper Banner */}
            {authTab === 'login' && (
              <div className="mx-6 mt-4 p-3 bg-[#1E2024] border border-[#7E57C2]/40 rounded-lg flex items-center justify-between gap-3">
                <div className="text-[11px] text-[#B8BCC4] leading-tight">
                  <span className="text-white font-medium block">Demo Cinephile Account</span>
                  <span className="font-mono text-[#8A8F99]">alex@aspectt.com • Password123!</span>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="px-2.5 py-1 rounded bg-[#7E57C2]/20 hover:bg-[#7E57C2] text-[#7E57C2] hover:text-white border border-[#7E57C2]/40 text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={authTab === 'login' ? handleLoginSubmit : handleRegisterSubmit}
              className="p-6 space-y-4"
            >
              {authError && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs">
                  {authError}
                </div>
              )}

              {authTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="alex@aspectt.com"
                  className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B8BCC4] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1E2024] border border-[#353941] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {authLoading
                    ? 'Processing...'
                    : authTab === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}