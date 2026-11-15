import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { watchlist, showToast, userAvatar } = useWatchlist();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (isAuthenticated) {
      navigate('/profile');
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    setIsOpen(false);
    showToast?.('Logged out of Aspectt');
  };

  const handleOpenAuth = (mode) => {
    setIsOpen(false);
    openAuthModal(mode);
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  // Avatar src priority: user.avatarUrl -> userAvatar -> null
  const displayAvatar = user?.avatarUrl || userAvatar;
  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Sign In';

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Trigger Button in Navbar */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 p-1.5 rounded-full sm:rounded-lg transition-all cursor-pointer border ${
          isOpen
            ? 'bg-white/10 border-[#7E57C2]'
            : 'hover:bg-white/5 border-transparent hover:border-[#353941]'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={isAuthenticated ? `Signed in as ${user?.name}` : 'Account options'}
      >
        {isAuthenticated ? (
          <Avatar
            src={displayAvatar}
            alt={user?.name || 'User'}
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#7E57C2',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#FFFFFF',
              borderRadius: '50%',
              border: '1.5px solid #353941',
            }}
          >
            {initialLetter}
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#B8BCC4]">
            <PersonOutlineIcon sx={{ fontSize: 18 }} />
          </div>
        )}

        <span className="text-sm font-medium text-white hidden sm:inline drop-shadow-sm max-w-[120px] truncate">
          {isAuthenticated ? firstName : 'Sign In'}
        </span>

        <KeyboardArrowDownIcon
          sx={{ fontSize: 16 }}
          className={`text-[#8A8F99] transition-transform duration-200 hidden sm:inline ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#282B30] border border-[#353941] rounded-2xl shadow-2xl py-2 z-[150] animate-fadeIn backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {isAuthenticated ? (
            /* ========================================================== */
            /* LOGGED-IN VIEW: User Details, Nav, and Working Logout       */
            /* Strictly hides "Login" and "Sign Up"                       */
            /* ========================================================== */
            <div>
              {/* User Identity Header Card */}
              <div className="px-5 py-4 flex items-center gap-3.5 border-b border-[#353941]">
                <Avatar
                  src={displayAvatar}
                  alt={user?.name}
                  sx={{
                    width: 46,
                    height: 46,
                    bgcolor: '#7E57C2',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1.5px solid #353941',
                  }}
                >
                  {initialLetter}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">
                      {user?.name}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1E2024] border border-[#353941] text-[#7E57C2]">
                      {user?.subscriptionTier === 'pro' ? 'PRO' : 'MEMBER'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8F99] font-mono truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-2 px-2 space-y-0.5">
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#353941] text-left transition-colors text-xs font-semibold text-white group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                    <PersonOutlineIcon sx={{ fontSize: 16 }} />
                  </div>
                  <div className="flex-1">
                    <span>Profile & Settings</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#353941] text-left transition-colors text-xs font-semibold text-white group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                      <BookmarkBorderIcon sx={{ fontSize: 16 }} />
                    </div>
                    <span>My Watchlist</span>
                  </div>
                  {watchlist.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#1E2024] border border-[#353941] text-[11px] font-mono text-[#B8BCC4]">
                      {watchlist.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavigate('/explore')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#353941] text-left transition-colors text-xs font-semibold text-white group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4] group-hover:text-white transition-colors">
                    <MovieOutlinedIcon sx={{ fontSize: 16 }} />
                  </div>
                  <span>Browse Catalog</span>
                </button>
              </div>

              {/* Working Logout Section */}
              <div className="pt-1 px-2 border-t border-[#353941]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#24171A]/40 hover:bg-[#332024] border border-[#4A282D]/60 hover:border-[#4A282D] text-left transition-all text-xs font-semibold text-[#E57373] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#24171A] border border-[#4A282D] flex items-center justify-center text-[#E57373] group-hover:text-[#FF8A80] transition-colors">
                      <LogoutOutlinedIcon sx={{ fontSize: 16 }} />
                    </div>
                    <span className="group-hover:text-[#FF8A80] transition-colors">
                      Logout
                    </span>
                  </div>
                  <span className="text-[11px] text-[#B57C7C]">Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* LOGGED-OUT VIEW: Sign In and Create Account Options        */
            /* Strictly hides User details and Logout                     */
            /* ========================================================== */
            <div className="p-4">
              <div className="text-center pb-3 border-b border-[#353941]">
                <div className="w-10 h-10 mx-auto rounded-xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-2">
                  <PersonOutlineIcon sx={{ fontSize: 22 }} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Aspectt Cinema
                </h4>
                <p className="text-xs text-[#8A8F99] mt-0.5">
                  Sign in to access your curated library, watchlist, and 4K stream.
                </p>
              </div>

              <div className="mt-3.5 space-y-2">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#7E57C2] hover:bg-[#6D48B5] text-white text-xs font-semibold shadow-md shadow-[#7E57C2]/20 transition-all cursor-pointer"
                >
                  <LoginIcon sx={{ fontSize: 16 }} />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => handleOpenAuth('register')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1E2024] hover:bg-[#353941] border border-[#353941] text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <PersonAddAltIcon sx={{ fontSize: 16 }} />
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

