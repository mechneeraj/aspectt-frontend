import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
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
  const {
    authModal,
    closeAuthModal,
    login,
    sendOtp,
    verifyOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    setAuthAvatar,
  } = useAuth();
  const { showToast } = useWatchlist();

  // Tab & Step states
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'avatar'

  // Forgot Password flow states: 'identify' | 'otp' | 'reset'
  const [forgotStep, setForgotStep] = useState('identify');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Resend Countdown Timers (seconds)
  const [signupCountdown, setSignupCountdown] = useState(0);
  const [forgotCountdown, setForgotCountdown] = useState(0);

  // Form input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
  const errorRef = useRef(null);

  // Countdowns for resending OTPs
  useEffect(() => {
    if (signupCountdown > 0) {
      const timer = setInterval(() => setSignupCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [signupCountdown]);

  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setInterval(() => setForgotCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [forgotCountdown]);

  // Smoothly scroll error banner into view if validation/server error occurs
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  // Synchronize modal state on open
  useEffect(() => {
    if (authModal.isOpen) {
      setTab(authModal.initialTab || 'login');
      setStep('form');
      setForgotStep('identify');
      setError('');
      setOtpCode('');
      setOtpInfo('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setResetToken('');
      setForgotIdentifier('');
      setForgotEmail('');
      setForgotMaskedEmail('');
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

  // Switch to Forgot Password mode
  const handleOpenForgot = () => {
    setTab('forgot');
    setForgotStep('identify');
    setError('');
    setOtpInfo('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setResetToken('');
    if (email.trim()) {
      setForgotIdentifier(email.trim());
    }
  };

  // Return back to Login from any Forgot Password step
  const handleBackToLogin = () => {
    setTab('login');
    setStep('form');
    setForgotStep('identify');
    setError('');
    setOtpInfo('');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetToken('');
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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      const hasMinLength = password.length >= 6;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[^A-Za-z0-9]/.test(password);

      if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        setError('Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      // Step 1: Dispatch 6-digit OTP via Brevo API
      setLoading(true);
      try {
          await sendOtp({
            name: name.trim(),
            email: email.trim(),
            password,
          });

  setOtpInfo(`We've sent a 6-digit verification code to ${email.trim()}, if not received please check spam folder`);
  setOtpCode(''); // Strictly initialized as empty!
  setSignupCountdown(30);
  setStep('otp');
} catch (err) {
  setError(err.message || 'Failed to dispatch verification code. Please try again.');
} finally {
  setLoading(false);
}
    }
  };

// Step 2 (Signup): Verify OTP and advance to avatar selection
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

    setOtpCode(''); // Strictly clear OTP state on success
    setStep('avatar');
  } catch (err) {
    setError(err.message || 'Invalid verification code. Please check and try again.');
    setOtpCode(''); // Strictly reset OTP state to empty on error!
  } finally {
    setLoading(false);
  }
};

// Resend OTP handler for Signup
const handleResendOtp = async () => {
  setError('');
  setOtpCode(''); // Strictly reset OTP state to empty on resend!
  setLoading(true);
  try {
      await sendOtp({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setOtpInfo(`A fresh code has been sent to ${ email.trim() }, if not received please check spam folder`);
      setSignupCountdown(30);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 (Signup): Save selected avatar and complete onboarding
  const handleSaveAvatar = async () => {
    setLoading(true);
    try {
      if (selectedAvatar) {
        await setAuthAvatar(selectedAvatar);
      }
      showToast?.(`Welcome to Aspectt, ${ name.trim() } !`);
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
    showToast?.(`Welcome to Aspectt, ${ name.trim() } !`);
    closeAuthModal();
    navigate('/');
  };

  // ==============================================================================
  // Forgot Password Handlers
  // ==============================================================================
  const handleForgotSubmitIdentify = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please provide your registered email address or mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpCode(''); // Strictly empty!

    try {
      const res = await forgotPassword({
        identifier: forgotIdentifier.trim(),
        email: forgotIdentifier.trim(),
      });

      setForgotEmail(res?.email || forgotIdentifier.trim());
      setForgotMaskedEmail(res?.maskedEmail || res?.email || forgotIdentifier.trim());
      setOtpInfo(res?.message || 'A 6-digit verification code has been sent to your registered email.');
      setForgotStep('otp');
      setForgotCountdown(30);
    } catch (err) {
      setError(err?.message || 'Failed to dispatch password reset code. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    setError('');
    setOtpCode(''); // Strictly clear OTP state on resend!
    setLoading(true);

    try {
      const res = await forgotPassword({
        identifier: forgotIdentifier.trim(),
        email: forgotIdentifier.trim(),
      });

      setOtpInfo(res?.message || 'A fresh verification code has been sent to your registered email.');
      setForgotCountdown(30);
    } catch (err) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyResetOtp({
        email: forgotEmail || forgotIdentifier.trim(),
        otp: otpCode.trim(),
      });

      setResetToken(res?.resetToken || '');
      setOtpCode(''); // Clear OTP state after verification!
      setForgotStep('reset');
    } catch (err) {
      setError(err?.message || 'Invalid or expired verification code. Please check and try again.');
      setOtpCode(''); // Strictly reset OTP state to empty on error!
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmitNewPassword = async (e) => {
    e.preventDefault();
    setError('');

    const hasMinLength = newPassword.length >= 6;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setError('Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        resetToken,
        newPassword,
        email: forgotEmail || forgotIdentifier.trim(),
      });

      showToast?.('Password reset successfully! Please sign in with your new password.');
      if (forgotEmail) {
        setEmail(forgotEmail);
      }
      setPassword('');
      handleBackToLogin();
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={step === 'avatar' ? undefined : closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-[#282B30] border border-[#353941] rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================== */}
        {/* FORGOT PASSWORD FLOW (3 STEPS)                             */}
        {/* ========================================================== */}
        {tab === 'forgot' ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {forgotStep === 'identify' ? (
              /* Forgot Step 1: Identify Account */
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#353941] bg-[#222428] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7E57C2]" />
                    <h2 className="text-base font-bold text-white tracking-wide">
                      Reset Password
                    </h2>
                  </div>
                  <button
                    onClick={closeAuthModal}
                    className="p-1 rounded-md text-[#B8BCC4] hover:text-white hover:bg-[#353941] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>

                <form onSubmit={handleForgotSubmitIdentify} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 overscroll-contain scrollbar-thin">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-2">
                        <LockOutlinedIcon sx={{ fontSize: 22 }} />
                      </div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Forgot Your Password?
                      </h3>
                      <p className="text-xs text-[#8A8F99] mt-0.5 max-w-xs mx-auto">
                        Enter your registered email address or mobile number to receive a 6-digit verification code.
                      </p>
                    </div>

                    {error && (
                      <div ref={errorRef} className="p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                        <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                        Registered Email or Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                          <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                        </div>
                        <input
                          type="text"
                          value={forgotIdentifier}
                          onChange={(e) => {
                            setForgotIdentifier(e.target.value);
                            setError('');
                          }}
                          placeholder="alex@aspectt.com or 9876543210"
                          className="w-full pl-9 pr-3 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pinned Sticky Footer */}
                  <div className="shrink-0 px-5 py-3.5 border-t border-[#353941] bg-[#222428] space-y-2">
                    <button
                      type="submit"
                      disabled={loading || !forgotIdentifier.trim()}
                      className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Reset Code...</span>
                        </span>
                      ) : (
                        'Send Reset OTP'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="text-xs text-[#7E57C2] hover:underline font-semibold cursor-pointer"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : forgotStep === 'otp' ? (
              /* Forgot Step 2: Verify Reset OTP */
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#353941] bg-[#222428] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('identify');
                      setError('');
                      setOtpCode('');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#B8BCC4] hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={closeAuthModal}
                    className="p-1 rounded-md text-[#B8BCC4] hover:text-white hover:bg-[#353941] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>

                <form onSubmit={handleForgotVerifyOtp} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 overscroll-contain scrollbar-thin">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-2">
                        <EmailOutlinedIcon sx={{ fontSize: 22 }} />
                      </div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Verify Reset Code
                      </h3>
                      <p className="text-xs text-[#8A8F99] mt-0.5 max-w-xs mx-auto">
                        We've sent a 6-digit password reset code to{' '}
                        <strong className="text-white font-mono">{forgotMaskedEmail || forgotEmail || forgotIdentifier}</strong>
                      </p>
                    </div>

                    {otpInfo && (
                      <div className="p-2.5 bg-[#1E2024] border border-[#7E57C2]/40 rounded-xl text-[#7E57C2] text-xs text-center font-medium">
                        {otpInfo}
                      </div>
                    )}

                    {error && (
                      <div ref={errorRef} className="p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                        <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5 text-center">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full py-2.5 px-4 bg-[#1E2024] border border-[#353941] rounded-xl text-center text-xl font-mono tracking-[0.4em] text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="text-center">
                      {forgotCountdown > 0 ? (
                        <span className="text-xs text-[#8A8F99]">
                          Resend code in <strong className="text-white">{forgotCountdown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleForgotResendOtp}
                          disabled={loading}
                          className="text-xs text-[#7E57C2] hover:underline cursor-pointer disabled:opacity-50"
                        >
                          Didn't receive the code? Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pinned Sticky Footer */}
                  <div className="shrink-0 px-5 py-3.5 border-t border-[#353941] bg-[#222428] space-y-2">
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying Code...</span>
                        </span>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="text-xs text-[#7E57C2] hover:underline font-semibold cursor-pointer"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* Forgot Step 3: Set New Password */
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#353941] bg-[#222428] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7E57C2]" />
                    <h2 className="text-base font-bold text-white tracking-wide">
                      Set New Password
                    </h2>
                  </div>
                  <button
                    onClick={closeAuthModal}
                    className="p-1 rounded-md text-[#B8BCC4] hover:text-white hover:bg-[#353941] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </div>

                <form onSubmit={handleForgotSubmitNewPassword} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 overscroll-contain scrollbar-thin">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-2">
                        <LockOutlinedIcon sx={{ fontSize: 22 }} />
                      </div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Create New Password
                      </h3>
                      <p className="text-xs text-[#8A8F99] mt-0.5 max-w-xs mx-auto">
                        Please enter a strong new password for your Aspectt account.
                      </p>
                    </div>

                    {error && (
                      <div ref={errorRef} className="p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                        <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{error}</span>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                          <LockOutlinedIcon sx={{ fontSize: 18 }} />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setError('');
                          }}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8F99] hover:text-white transition-colors cursor-pointer"
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? (
                            <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          )}
                        </button>
                      </div>

                      {/* Single-line requirement guide */}
                      <p className={`text - [11px] mt - 1 transition - colors ${
    newPassword && newPassword.length >= 6 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
      ? 'text-emerald-400 font-medium'
      : 'text-[#8A8F99]'
  } `}>
                        Must be at least 6 characters (uppercase, lowercase, number & symbol)
                      </p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                          <LockOutlinedIcon sx={{ fontSize: 18 }} />
                        </div>
                        <input
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            setError('');
                          }}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8F99] hover:text-white transition-colors cursor-pointer"
                          title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                          aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmNewPassword ? (
                            <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          )}
                        </button>
                      </div>
                      {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <span className="text-[11px] text-[#E57373] mt-0.5 block">
                          Passwords do not match
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pinned Sticky Footer */}
                  <div className="shrink-0 px-5 py-3.5 border-t border-[#353941] bg-[#222428] space-y-2">
                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmNewPassword}
                      className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Resetting Password...</span>
                        </span>
                      ) : (
                        'Reset Password'
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="text-xs text-[#7E57C2] hover:underline font-semibold cursor-pointer"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : step === 'avatar' ? (
          /* ========================================================== */
          /* STEP 3: Choose Your Avatar Onboarding                       */
          /* ========================================================== */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-5 text-center shrink-0 border-b border-[#353941]/50 bg-[#222428]">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[#7E57C2]/20 border border-[#7E57C2] flex items-center justify-center text-[#7E57C2] mb-2">
                <PersonOutlineIcon sx={{ fontSize: 22 }} />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Choose Your Persona
              </h2>
              <p className="text-xs text-[#8A8F99] mt-0.5 max-w-xs mx-auto">
                Pick a cinema avatar that represents your taste on Aspectt.
              </p>
            </div>

            {/* Curated Cinema/Indie Avatar Grid (8 distinct portraits) */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain scrollbar-thin">
              <div className="grid grid-cols-4 gap-3">
                {curatedAvatars.map((avatar) => {
                  const isSelected = selectedAvatar.id === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative p - 2.5 rounded - xl flex items - center justify - center transition - all cursor - pointer border ${
    isSelected
      ? 'bg-[#7E57C2]/15 border-[#7E57C2] scale-105 shadow-lg shadow-[#7E57C2]/20'
      : 'bg-[#1E2024] border-[#353941] hover:border-[#7E57C2]/50 hover:bg-[#1E2024]/80'
  } `}
                    >
                      <div className="relative">
                        <Avatar
                          src={avatar.src}
                          alt="Avatar"
                          sx={{
                            width: 54,
                            height: 54,
                            bgcolor: avatar.color || '#7E57C2',
                            borderRadius: '14px',
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pinned Action Area */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-[#353941] bg-[#222428] space-y-2">
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-1.5 text-xs font-medium text-[#8A8F99] hover:text-white transition-colors cursor-pointer text-center"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : step === 'otp' ? (
          /* ========================================================== */
          /* STEP 2: Email OTP Verification Screen                       */
          /* ========================================================== */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Compact Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#353941] bg-[#222428] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtpCode('');
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
                aria-label="Close"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-3.5 scrollbar-thin">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#7E57C2] mb-2">
                    <EmailOutlinedIcon sx={{ fontSize: 22 }} />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-[#8A8F99] mt-0.5 max-w-xs mx-auto">
                    We've sent a 6-digit confirmation code to{' '}
                    <strong className="text-white font-mono">{email}</strong>
                  </p>
                </div>

                {otpInfo && (
                  <div className="p-2.5 bg-[#1E2024] border border-[#7E57C2]/40 rounded-xl text-[#7E57C2] text-xs text-center font-medium">
                    {otpInfo}
                  </div>
                )}

                {error && (
                  <div ref={errorRef} className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#B8BCC4] mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full py-2.5 px-4 bg-[#1E2024] border border-[#353941] rounded-xl text-center text-xl font-mono tracking-[0.4em] text-white placeholder-[#5A5F6B] focus:outline-none focus:border-[#7E57C2] transition-colors"
                    autoFocus
                    required
                  />
                </div>

                <div className="text-center">
                  {signupCountdown > 0 ? (
                    <span className="text-xs text-[#8A8F99]">
                      Resend code in <strong className="text-white">{signupCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs text-[#7E57C2] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Didn't receive the code? Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-[#353941] bg-[#222428]">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========================================================== */
          /* STEP 1: Login & Signup Forms with Viewport-Responsive Layout */
          /* ========================================================== */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* 1. Compact Header (shrink-0) */}
            <div className="shrink-0 bg-[#222428] border-b border-[#353941]">
              <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-3.5">
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
                  aria-label="Close"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              {/* Auth Gate Notification Banner */}
              {authModal.message && (
                <div className="mx-5 mb-2.5 sm:mx-6 p-2 bg-[#7E57C2]/15 border border-[#7E57C2]/40 rounded-xl text-xs text-[#E0D4F7] text-center font-medium leading-relaxed">
                  {authModal.message}
                </div>
              )}

              {/* Tab Toggle (Sign In / Create Account) */}
              <div className="grid grid-cols-2 p-1 mx-5 mb-3 sm:mx-6 bg-[#1E2024] rounded-xl border border-[#353941]">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                    setOtpCode('');
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className={`py - 1.5 text - xs font - semibold rounded - lg transition - all cursor - pointer ${
    tab === 'login'
      ? 'bg-[#7E57C2] text-white shadow-sm'
      : 'text-[#B8BCC4] hover:text-white'
  } `}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError('');
                    setOtpCode('');
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className={`py - 1.5 text - xs font - semibold rounded - lg transition - all cursor - pointer ${
    tab === 'register'
      ? 'bg-[#7E57C2] text-white shadow-sm'
      : 'text-[#B8BCC4] hover:text-white'
  } `}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Form enclosing scrollable body and pinned footer */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* 2. Scrollable Form Body (flex-1 overflow-y-auto) */}
              <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6 sm:py-3.5 space-y-2.5 overscroll-contain scrollbar-thin">
                {/* Compact Inline Error Banner */}
                {error && (
                  <div
                    ref={errorRef}
                    className="p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Signup Field: Full Name */}
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                        <PersonOutlineIcon sx={{ fontSize: 18 }} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError('');
                        }}
                        placeholder="e.g. Alex Vance"
                        className="w-full pl-9 pr-3 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Common Field: Email Address */}
                <div>
                  <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                      <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Common Field: Password with Single Eye Toggle & Forgot Password Link */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#B8BCC4]">
                      Password
                    </label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={handleOpenForgot}
                        className="text-xs text-[#7E57C2] hover:text-[#9575CD] hover:underline cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                      <LockOutlinedIcon sx={{ fontSize: 18 }} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
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

                  {/* Password Requirement Guide during Registration (Single Line) */}
                  {tab === 'register' && (
                    <p className={`text - [11px] mt - 1 transition - colors ${
    password && password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
      ? 'text-emerald-400 font-medium'
      : 'text-[#8A8F99]'
  } `}>
                      Must be at least 6 characters (uppercase, lowercase, number & symbol)
                    </p>
                  )}
                </div>

                {/* Signup Field: Confirm Password with Single Eye Toggle */}
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-[#B8BCC4] mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A8F99]">
                        <LockOutlinedIcon sx={{ fontSize: 18 }} />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2 bg-[#1E2024] border border-[#353941] rounded-xl text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
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
                      <span className="text-[11px] text-[#E57373] mt-0.5 block">
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                {/* Quick Demo Fill button for instant testing in Login */}
                {tab === 'login' && (
                  <div className="pt-0.5 flex items-center justify-between text-xs">
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
              </div>

              {/* 3. Sticky / Pinned Footer Action Area (shrink-0) */}
              <div className="shrink-0 px-5 py-3 sm:px-6 sm:py-3.5 border-t border-[#353941] bg-[#222428]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#7E57C2] hover:bg-[#6D48B5] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#7E57C2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{tab === 'login' ? 'Signing in...' : 'Sending OTP...'}</span>
                    </span>
                  ) : tab === 'login' ? (
                    'Sign In'
                  ) : (
                    'Sign Up / Send OTP'
                  )}
                </button>

                {/* Login / Sign Up Switch Link */}
                <div className="text-center pt-2 text-xs text-[#8A8F99]">
                  {tab === 'login' ? (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setTab('register');
                          setError('');
                          setOtpCode('');
                        }}
                        className="text-[#7E57C2] hover:underline font-semibold cursor-pointer ml-1"
                      >
                        Sign Up
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setError('');
                          setOtpCode('');
                        }}
                        className="text-[#7E57C2] hover:underline font-semibold cursor-pointer ml-1"
                      >
                        Sign In
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
