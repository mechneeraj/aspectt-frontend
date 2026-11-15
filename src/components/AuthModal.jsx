import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function AuthModal() {
  const { authModal, closeAuthModal, login, register } = useAuth();
  const { showToast } = useWatchlist();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync tab with authModal.initialTab whenever modal opens
  useEffect(() => {
    if (authModal.isOpen) {
      setTab(authModal.initialTab || 'login');
      setError('');
      setShowPassword(false);
      // Do not clear email/password on tab toggle if already typed
    }
  }, [authModal.isOpen, authModal.initialTab]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!authModal.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModal.isOpen, closeAuthModal]);

  if (!authModal.isOpen) return null;

  const handleFillDemo = () => {
    setEmail('alex@aspectt.com');
    setPassword('Password123!');
    setTab('login');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setLoading(true);
      try {
        const res = await login(email.trim(), password);
        showToast?.(`Welcome back, ${res?.user?.name || 'Film Enthusiast'}!`);
      } catch (err) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill out all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      setLoading(true);
      try {
        const res = await register(name.trim(), email.trim(), password);
        showToast?.(`Welcome to Aspectt, ${res?.user?.name || name.trim()}!`);
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#353941] bg-[#222428]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7E57C2]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              {tab === 'login' ? 'Sign In to Aspectt' : 'Create Aspectt Account'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-md text-[#B8BCC4] hover:text-white hover:bg-[#353941] transition-colors cursor-pointer"
            title="Close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Auth Gate Notification Banner */}
        {authModal.message && (
          <div className="mx-6 mt-4 p-3 bg-[#7E57C2]/15 border border-[#7E57C2]/40 rounded-xl text-xs text-[#E0D4F7] text-center font-medium leading-relaxed">
            {authModal.message}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-5 bg-[#1E2024] rounded-xl border border-[#353941]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
              setShowPassword(false);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-[#7E57C2] text-white shadow-sm'
                : 'text-[#B8BCC4] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
              setShowPassword(false);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-[#7E57C2] text-white shadow-sm'
                : 'text-[#B8BCC4] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                  <PersonOutlineIcon sx={{ fontSize: 18 }} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                <EmailOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#B8BCC4]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[11px] text-[#8A8F99] hover:text-[#7E57C2] transition-colors cursor-pointer flex items-center gap-1 select-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <>
                    <VisibilityOffOutlinedIcon sx={{ fontSize: 14 }} />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                <LockOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8F99] hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Fill button for instant testing */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1 text-[#B8BCC4] hover:text-[#7E57C2] transition-colors cursor-pointer"
            >
              <FlashOnIcon sx={{ fontSize: 14 }} className="text-[#7E57C2]" />
              <span>Fill Demo Credentials</span>
            </button>
            <span className="text-[#8A8F99] font-mono text-[11px]">alex@aspectt.com</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : tab === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

