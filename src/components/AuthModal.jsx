import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Avatar from '@mui/material/Avatar';

import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import { AVATAR_OPTIONS } from '../data/avatars';

export default function AuthModal() {
  const navigate = useNavigate();
  const { authModal, closeAuthModal, login, sendOtp, verifyOtp, setAuthAvatar } = useAuth();
  const { showToast } = useWatchlist();

  // Tab & Step states
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'avatar'

  // Form input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Password visibility toggles (single eye icon per input)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar selection state (first 8 curated cinema avatars)
  const curatedAvatars = AVATAR_OPTIONS.slice(0, 8);
  const [selectedAvatar, setSelectedAvatar] = useState(curatedAvatars[0]);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  // Synchronize modal state on open
  useEffect(() => {
    if (authModal.isOpen) {
      setTab(authModal.initialTab || 'login');
      setStep('form');
      setError('');
      setOtpCode('');
      setOtpInfo('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [authModal.isOpen, authModal.initialTab]);

  // Handle Escape key to close modal (except during active avatar onboarding)
  useEffect(() => {
    if (!authModal.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && step !== 'avatar') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModal.isOpen, step, closeAuthModal]);

  if (!authModal.isOpen) return null;

  const handleFillDemo = () => {
    setEmail('alex@aspectt.com');
    setPassword('Password123!');
    setTab('login');
    setError('');
  };

  // 10-digit mobile phone validation
  const validatePhone = (phoneNumber) => {
    const digitsOnly = String(phoneNumber || '').replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  // Step 1: Submit Form (Login or Send OTP for Signup)
  const handleSubmitForm = async (e) => {
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
      // Signup form validation
      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }

      if (!phone.trim() || !validatePhone(phone)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      // Step 1: Dispatch 6-digit OTP via Brevo API
      setLoading(true);
      try {
        const otpRes = await sendOtp({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });

        setOtpInfo(
          otpRes?.devOtp
            ? `Code sent! (Dev code: ${otpRes.devOtp})`
            : `We've sent a 6-digit verification code to ${email.trim()},if not received please check spam folder`
        );

        if (otpRes?.devOtp) {
          setOtpCode(otpRes.devOtp);
        }

        // Transition to Step 2: OTP Verification screen
        setStep('otp');
      } catch (err) {
        setError(err.message || 'Failed to dispatch verification code. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 2: Verify OTP and create permanent account in Supabase
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp({
        email: email.trim(),
        otp: otpCode.trim(),
      });

      // Transition to Step 3: Avatar selection
      setStep('avatar');
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      setOtpInfo(
        res?.devOtp
          ? `Code resent! (Dev code: ${res.devOtp})`
          : `A fresh code has been sent to ${email.trim()}, if not received please check spam folder`
      );
      if (res?.devOtp) setOtpCode(res.devOtp);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save selected avatar and complete onboarding
  const handleSaveAvatar = async () => {
    setLoading(true);
    try {
      if (selectedAvatar) {
        await setAuthAvatar(selectedAvatar);
      }
      showToast?.(`Welcome to Aspectt, ${name.trim()}!`);
      closeAuthModal();
      navigate('/');
    } catch (err) {
      console.warn('Avatar save note:', err);
      closeAuthModal();
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAvatar = () => {
    showToast?.(`Welcome to Aspectt, ${name.trim()}!`);
    closeAuthModal();
    navigate('/');
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={step === 'avatar' ? undefined : closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================== */}
        {/* STEP 3: Choose Your Avatar Onboarding                       */}
        {/* ========================================================== */}
        {step === 'avatar' ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#7E57C2]/20 border border-[#7E57C2] flex items-center justify-center text-[#7E57C2] mb-3">
                <PersonOutlineIcon sx={{ fontSize: 26 }} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Choose Your Persona
              </h2>
              <p className="text-xs text-[#8A8F99] mt-1 max-w-xs mx-auto">
                Pick a cinema avatar that represents your taste on Aspectt.
              </p>
            </div>

            {/* Curated Cinema/Indie Avatar Grid (8 distinct portraits) */}
            <div className="grid grid-cols-4 gap-3.5 mb-6">
              {curatedAvatars.map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative p-2 rounded-xl flex flex-col items-center transition-all cursor-pointer border ${isSelected
                      ? 'bg-[#7E57C2]/15 border-[#7E57C2] scale-105 shadow-lg shadow-[#7E57C2]/20'
                      : 'bg-[#1E2024] border-[#353941] hover:border-[#7E57C2]/50 hover:bg-[#1E2024]/80'
                      }`}
                  >
                    <div className="relative">
                      <Avatar
                        src={avatar.src}
                        alt={avatar.name}
                        sx={{
                          width: 52,
                          height: 52,
                          bgcolor: avatar.color || '#7E57C2',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #7E57C2' : '1px solid #353941',
                        }}
                      >
                        {avatar.name.charAt(0)}
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#7E57C2] text-white flex items-center justify-center shadow-md">
                          <CheckIcon sx={{ fontSize: 13 }} />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium truncate max-w-full ${isSelected ? 'text-white font-semibold' : 'text-[#8A8F99]'
                        }`}
                    >
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Persona Preview */}
            <div className="flex items-center justify-center gap-2 mb-5 py-2 px-3 bg-[#1E2024] border border-[#353941] rounded-xl text-xs text-[#B8BCC4]">
              <span>Selected Persona:</span>
              <strong className="text-white font-semibold">{selectedAvatar.name}</strong>
            </div>

            {/* Actions: Save & Continue + Skip */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={loading}
                className="w-full py-3 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Save & Continue'
                )}
              </button>

              <button
                type="button"
                onClick={handleSkipAvatar}
                className="w-full py-2 text-xs font-medium text-[#8A8F99] hover:text-white transition-colors cursor-pointer text-center"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : step === 'otp' ? (
          /* ========================================================== */
          /* STEP 2: Email OTP Verification Screen                       */
          /* ========================================================== */
          <div className="p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#353941]">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="inline-flex items-center gap-1 text-xs text-[#B8BCC4] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span>Back to Edit</span>
              </button>
              <button
                onClick={closeAuthModal}
                className="p-1 rounded-md text-[#B8BCC4] hover:text-white hover:bg-[#353941] transition-colors cursor-pointer"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-3">
                <EmailOutlinedIcon sx={{ fontSize: 24 }} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Verify Your Email
              </h2>
              <p className="text-xs text-[#8A8F99] mt-1 max-w-xs mx-auto">
                We've sent a 6-digit confirmation code to{' '}
                <strong className="text-white font-mono">{email}</strong>
              </p>
            </div>

            {otpInfo && (
              <div className="p-2.5 mb-4 bg-[#1E2024] border border-[#7E57C2]/40 rounded-xl text-[#7E57C2] text-xs text-center font-medium">
                {otpInfo}
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full py-3 px-4 bg-[#1E2024] border border-[#353941] rounded-xl text-center text-xl font-mono tracking-[0.5em] text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs text-[#7E57C2] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Didn't receive the code? Resend OTP
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================== */
          /* STEP 1: Login & Signup Forms with Single Eye Toggles        */
          /* ========================================================== */
          <div>
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
                  setShowConfirmPassword(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === 'login'
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
                  setShowConfirmPassword(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${tab === 'register'
                  ? 'bg-[#7E57C2] text-white shadow-sm'
                  : 'text-[#B8BCC4] hover:text-white'
                  }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {/* Signup Field: Full Name */}
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

              {/* Signup Field: Mobile Number (10 digits) */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                      <PhoneAndroidOutlinedIcon sx={{ fontSize: 18 }} />
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors font-mono"
                      required
                    />
                  </div>
                  {phone && phone.length > 0 && phone.length < 10 && (
                    <span className="text-[11px] text-[#E57373] mt-1 block">
                      Must be exactly 10 digits ({phone.length}/10)
                    </span>
                  )}
                </div>
              )}

              {/* Common Field: Email Address */}
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

              {/* Common Field: Password with Single Eye Toggle */}
              <div>
                <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5">
                  Password
                </label>
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

              {/* Signup Field: Confirm Password with Single Eye Toggle */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                      <LockOutlinedIcon sx={{ fontSize: 18 }} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8F99] hover:text-white transition-colors cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span className="text-[11px] text-[#E57373] mt-1 block">
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}

              {/* Quick Demo Fill button for instant testing in Login */}
              {tab === 'login' && (
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
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{tab === 'login' ? 'Signing in...' : 'Sending OTP...'}</span>
                  </span>
                ) : tab === 'login' ? (
                  'Sign In'
                ) : (
                  'Continue / Send OTP'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
