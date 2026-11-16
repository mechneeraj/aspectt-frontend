import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarsIcon from '@mui/icons-material/Stars';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function Subscription() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    subscription,
    isSubscribed,
    isLoadingSubscription,
    activateSubscription,
    openAuthModal,
    pendingPlayback,
    clearPendingPlayback,
  } = useAuth();

  const { showToast } = useWatchlist();
  const [activatingPlan, setActivatingPlan] = useState(null); // 'MONTHLY' | 'YEARLY' | null

  const handleActivate = async (planName) => {
    if (!isAuthenticated) {
      openAuthModal('login', 'Please sign in or create an account to subscribe.');
      return;
    }

    try {
      setActivatingPlan(planName);
      const res = await activateSubscription(planName);
      if (res?.success) {
        showToast(
          planName === 'YEARLY'
            ? 'Yearly Plan (₹999) activated successfully!'
            : 'Monthly Plan (₹99) activated successfully!'
        );
      }
    } catch (err) {
      console.error('Subscription activation error:', err);
      showToast(err?.message || 'Failed to activate subscription. Please try again.');
    } finally {
      setActivatingPlan(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateString);
    }
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    try {
      const diff = new Date(expiryDate) - new Date();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  const isCurrentPlan = (planName) => {
    return isSubscribed && subscription?.planName === planName;
  };

  return (
    <div className="min-h-screen bg-[#1E2024] text-white pt-6 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto select-none">

      {/* Pending Playback Alert (if user was redirected here while trying to watch) */}
      {pendingPlayback && (
        <div className="mb-6 p-4 rounded-xl bg-[#282B30] border border-[#7E57C2]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in w-full overflow-hidden">
          <div className="flex items-start sm:items-center gap-3 w-full min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#7E57C2]/20 border border-[#7E57C2]/40 flex items-center justify-center text-[#7E57C2] shrink-0 mt-0.5 sm:mt-0">
              <PlayArrowIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white break-words leading-snug">
                Subscription required to stream{pendingPlayback?.title ? `: ${pendingPlayback.title}` : ' selected title'}
              </h4>
              <p className="text-xs text-[#B8BCC4] mt-0.5 break-words leading-relaxed">
                Choose a plan below to activate instant access and resume playback.
              </p>
            </div>
          </div>
          {isSubscribed ? (
            <button
              onClick={() => {
                const target = pendingPlayback?.id || (typeof pendingPlayback === 'string' ? pendingPlayback : null);
                clearPendingPlayback();
                if (target) {
                  navigate(`/movie/${target}?play=true`);
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 w-full sm:w-auto rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold shrink-0 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <PlayArrowIcon fontSize="small" />
              <span>Watch Now</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded bg-[#282B30] border border-[#353941] text-[#7E57C2] inline-block mb-3">
          Aspectt Membership
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          {isSubscribed ? 'Your Aspectt Membership' : 'Uncompromised Cinema. Zero Interruptions.'}
        </h1>
        <p className="text-xs sm:text-sm text-[#B8BCC4] leading-relaxed">
          {isSubscribed
            ? 'Your active pass unlocks unlimited streaming of curated auteur and festival selections in true director aspect ratio.'
            : 'Stream handpicked independent films, festival award-winners, and rare auteur archives in their true director aspect ratio.'}
        </p>
      </div>

      {/* 1. Current Plan Status Card (Shown only when user has an active, unexpired plan) */}
      {isSubscribed && (
        <section className="mb-12">
          <div className="p-5 sm:p-7 rounded-2xl bg-[#282B30] border border-[#353941] shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#8A8F99]">
                    Current Membership Status
                  </span>
                  {isLoadingSubscription ? (
                    <CircularProgress size={14} sx={{ color: '#7E57C2' }} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {subscription?.planName === 'YEARLY'
                    ? 'Yearly Plan'
                    : 'Monthly Plan'}
                </h2>
                <p className="text-xs text-[#B8BCC4]">
                  Valid until{' '}
                  <span className="text-white font-medium">
                    {formatDate(subscription?.expiryDate)}
                  </span>{' '}
                  •{' '}
                  <span className="text-[#7E57C2] font-semibold">
                    {getDaysRemaining(subscription?.expiryDate)} days remaining
                  </span>
                </p>
              </div>

              {/* Quick action / status indicator */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2024] border border-[#353941] text-xs text-white">
                  <ShieldOutlinedIcon fontSize="small" className="text-emerald-400" />
                  <span>Full Streaming Access Unlocked</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Dark Cinema Pricing Cards (Hidden when subscription is active; shown when expired or no plan) */}
      {!isSubscribed && (
        <section className="mb-14 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">

            {/* Card 1: Monthly Plan — ₹99 */}
            <div
              className={`flex flex-col justify-between p-6 sm:p-8 rounded-2xl transition-all duration-200 ${isCurrentPlan('MONTHLY')
                  ? 'bg-[#282B30] border-2 border-[#7E57C2] shadow-[0_0_30px_rgba(126,87,194,0.2)]'
                  : 'bg-[#282B30] border border-[#353941] hover:border-[#4B505B]'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#8A8F99] uppercase tracking-wider">
                    Flexible Monthly
                  </span>
                  {isCurrentPlan('MONTHLY') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7E57C2]/20 border border-[#7E57C2] text-[#7E57C2]">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Monthly Plan</h3>
                <p className="text-xs text-[#B8BCC4] mb-6">
                  Ideal for cinephiles seeking complete flexibility with monthly billing.
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">₹99</span>
                  <span className="text-xs text-[#8A8F99] font-medium">/ month</span>
                </div>
              </div>

              <button
                onClick={() => handleActivate('MONTHLY')}
                disabled={activatingPlan !== null || isCurrentPlan('MONTHLY')}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${isCurrentPlan('MONTHLY')
                    ? 'bg-[#1E2024] text-[#8A8F99] border border-[#353941] cursor-default'
                    : 'bg-[#7E57C2] hover:bg-[#6D42B9] active:bg-[#5E35B1] text-white border border-[#9575CD]/40'
                  }`}
              >
                {activatingPlan === 'MONTHLY' ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                    <span>Activating Monthly Plan...</span>
                  </>
                ) : isCurrentPlan('MONTHLY') ? (
                  <span>Active Monthly Plan</span>
                ) : (
                  <span>Activate Monthly (₹99)</span>
                )}
              </button>
            </div>

            {/* Card 2: Yearly Plan — ₹999 (Best Value) */}
            <div
              className={`flex flex-col justify-between p-6 sm:p-8 rounded-2xl relative transition-all duration-200 ${isCurrentPlan('YEARLY')
                  ? 'bg-[#282B30] border-2 border-[#7E57C2] shadow-[0_0_30px_rgba(126,87,194,0.2)]'
                  : 'bg-[#282B30] border border-[#353941] hover:border-[#4B505B]'
                }`}
            >
              {/* Best Value Badge */}
              <div className="absolute -top-3 right-6 bg-[#7E57C2] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-[#9575CD]/40 flex items-center gap-1 shadow-md">
                <StarsIcon sx={{ fontSize: 13 }} />
                <span>BEST VALUE</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#8A8F99] uppercase tracking-wider">
                    Full Year Auteur Pass
                  </span>
                  {isCurrentPlan('YEARLY') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7E57C2]/20 border border-[#7E57C2] text-[#7E57C2]">
                      CURRENT PLAN
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Yearly Plan</h3>
                <p className="text-xs text-[#B8BCC4] mb-6">
                  12 continuous months of uninterrupted cinema access.
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">₹999</span>
                  <span className="text-xs text-[#8A8F99] font-medium">/ year</span>
                </div>
              </div>

              <button
                onClick={() => handleActivate('YEARLY')}
                disabled={activatingPlan !== null || isCurrentPlan('YEARLY')}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${isCurrentPlan('YEARLY')
                    ? 'bg-[#1E2024] text-[#8A8F99] border border-[#353941] cursor-default'
                    : 'bg-[#7E57C2] hover:bg-[#6D42B9] active:bg-[#5E35B1] text-white border border-[#9575CD]/40'
                  }`}
              >
                {activatingPlan === 'YEARLY' ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                    <span>Activating Yearly Plan...</span>
                  </>
                ) : isCurrentPlan('YEARLY') ? (
                  <span>Active Yearly Plan</span>
                ) : (
                  <span>Activate Yearly (₹999)</span>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

