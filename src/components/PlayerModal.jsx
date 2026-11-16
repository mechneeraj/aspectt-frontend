import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsIcon from '@mui/icons-material/Settings';
import SpeedIcon from '@mui/icons-material/Speed';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import { moviesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Format raw seconds to MM:SS or HH:MM:SS
 */
function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return '00:00';
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = Math.floor(secs % 60);
  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Aspectt OTT Platform - Custom Cinema HLS Video Player
 *
 * Upgraded Features:
 * 1. Sleek Custom Overlay Controls with 3-second auto-hide during playback
 * 2. HLS Video Quality Switcher (Auto, 1080p, 720p, etc.) powered by hls.levels
 * 3. Playback Speed Selector (0.75x, 1x, 1.25x, 1.5x, 2x)
 * 4. Interactive Scrubber with Buffered Progress Bar & Hover Time Tooltip
 * 5. Fullscreen Toggle (Windowed Modal <-> Edge-to-Edge Cinema Screen)
 * 6. Cinema Keyboard Shortcuts (Space, Left/Right 10s, Mute, Fullscreen, Escape)
 * 7. Graceful Dark-Mode Error & Processing State
 */
export default function PlayerModal({ isOpen, onClose, movie, mode = 'feature' }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hlsInstanceRef = hlsRef; // Alias ensuring persistence across re-renders
  const progressBarRef = useRef(null);
  const qualityMenuRef = useRef(null);
  const speedMenuRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // UI / Controls state
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'quality' | 'speed' | null
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type, label }

  // HLS Quality state
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [actualLevel, setActualLevel] = useState(-1);

  // Auth & Secure Playback state
  const { logout, openAuthModal, isAuthenticated } = useAuth();
  const [streamUrl, setStreamUrl] = useState('');
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState('');

  const isM3u8 = streamUrl.endsWith('.m3u8') || /\.m3u8($|\?|#)/i.test(streamUrl);

  // Secure Server-Side Stream Authorization & Retrieval
  useEffect(() => {
    if (!isOpen || !movie) {
      setStreamUrl('');
      setIsLoadingStream(false);
      setStreamError('');
      return;
    }

    let isMounted = true;

    // Direct clips (e.g. Behind The Lens) that supply an explicit clipUrl
    if (mode === 'Footage' && (movie.clipUrl || movie.videoStreamUrl)) {
      setStreamUrl((movie.clipUrl || movie.videoStreamUrl || '').trim());
      setIsLoadingStream(false);
      return;
    }

    // For movies: Enforce authentication gate
    if (!isAuthenticated) {
      onClose();
      openAuthModal('login', 'Sign in or create a free account to watch films on Aspectt.');
      return;
    }

    setIsLoadingStream(true);
    setStreamError('');

    async function fetchSecureStream() {
      try {
        const res = await moviesApi.getStreamUrl(movie.id);
        if (!isMounted) return;
        const resolvedUrl = (res?.streamUrl || res?.videoStreamUrl || '').trim();
        if (resolvedUrl) {
          setStreamUrl(resolvedUrl);
        } else {
          setHasError(true);
          setStreamError('Secure stream unavailable.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Secure stream fetch error:', err);
        if (err?.status === 401) {
          // Token expired, missing, or invalidated by backend
          onClose();
          logout();
          openAuthModal('login', 'Sign in or create a free account to watch films on Aspectt.');
          return;
        }
        setHasError(true);
        setStreamError(err?.message || 'Failed to authorize video stream.');
      } finally {
        if (isMounted) {
          setIsLoadingStream(false);
        }
      }
    }

    fetchSecureStream();

    return () => {
      isMounted = false;
    };
  }, [isOpen, movie?.id, mode, isAuthenticated, retryKey, onClose, logout, openAuthModal]);

  // Close popover menus when clicking outside
  useEffect(() => {
    if (!activeMenu) return;

    const handleOutsideClick = (e) => {
      if (
        activeMenu === 'quality' &&
        qualityMenuRef.current &&
        !qualityMenuRef.current.contains(e.target)
      ) {
        setActiveMenu(null);
      }
      if (
        activeMenu === 'speed' &&
        speedMenuRef.current &&
        !speedMenuRef.current.contains(e.target)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [activeMenu]);

  // Trigger brief visual action feedback (e.g. +10s, Paused, Muted)
  const showFeedback = useCallback((type, label) => {
    setFeedback({ type, label });
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 650);
  }, []);

  // Auto-hide controls timer: hides after 3 seconds of mouse inactivity when playing
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying && !activeMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, activeMenu]);

  // Sync controls visibility whenever playback status or menus change
  useEffect(() => {
    if (!isPlaying || activeMenu) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimer();
    }
  }, [isPlaying, activeMenu, resetControlsTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Video / HLS initialization and teardown
  useEffect(() => {
    if (!isOpen || !movie || !streamUrl) return;

    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    setQualityLevels([]);
    setCurrentQuality(-1);
    setSelectedQuality(-1);
    setActualLevel(-1);

    const video = videoRef.current;
    if (!video) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3u8) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          // Read available quality levels
          const levels = (hls.levels || data.levels || []).map((lvl, index) => {
            const height = lvl.height;
            const label = height ? `${height}p` : lvl.name || `Quality ${index + 1}`;
            return {
              index,
              label,
              height: height || 0,
              bitrate: lvl.bitrate || 0,
            };
          });

          // Sort highest resolution first
          levels.sort((a, b) => (b.height || b.bitrate) - (a.height || a.bitrate));
          setQualityLevels(levels);

          video.play().catch((err) => {
            console.warn('Autoplay prevented by browser:', err);
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          setActualLevel(data.level);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS fatal network error, attempting reload...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS fatal media error, attempting recover...', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS unrecoverable error:', data);
                hls.destroy();
                setHasError(true);
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS for Safari/iOS
        video.src = streamUrl;
        video.play().catch((err) => {
          console.warn('Autoplay prevented by browser:', err);
        });
      } else {
        setHasError(true);
      }
    } else {
      // Direct MP4 stream
      video.src = streamUrl;
      video.play().catch((err) => {
        console.warn('Autoplay prevented by browser:', err);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [isOpen, movie, streamUrl, isM3u8, retryKey]);

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => console.warn('Play interrupted:', err));
      showFeedback('play', 'Play');
    } else {
      video.pause();
      showFeedback('pause', 'Pause');
    }
  }, [showFeedback]);

  // Relative Seek (-10s / +10s)
  const seekRelative = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    showFeedback(seconds > 0 ? 'forward' : 'rewind', `${seconds > 0 ? '+' : ''}${seconds}s`);
  }, [showFeedback]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const restored = volume === 0 ? 0.8 : volume;
      video.muted = false;
      video.volume = restored;
      setIsMuted(false);
      setVolume(restored);
      showFeedback('volume', `${Math.round(restored * 100)}%`);
    } else {
      video.muted = true;
      setIsMuted(true);
      showFeedback('mute', 'Muted');
    }
  }, [isMuted, volume, showFeedback]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch((err) => console.warn('Fullscreen error:', err));
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept when focusing text inputs
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          resetControlsTimer();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          seekRelative(-10);
          resetControlsTimer();
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          seekRelative(10);
          resetControlsTimer();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          resetControlsTimer();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (activeMenu) {
            setActiveMenu(null);
          } else if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeMenu, togglePlayPause, seekRelative, toggleMute, toggleFullscreen, resetControlsTimer, onClose]);

  if (!isOpen || !movie) return null;

  // Track buffered range
  const updateBuffered = () => {
    const video = videoRef.current;
    if (!video || !video.buffered.length) return;

    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= video.currentTime && video.currentTime <= video.buffered.end(i)) {
        setBufferedEnd(video.buffered.end(i));
        break;
      }
    }
  };

  // Scrubber click seek
  const handleSeek = (e) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const target = ratio * (duration || 0);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    resetControlsTimer();
  };

  // Scrubber hover preview
  const handleMouseMoveScrubber = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverPosition(clickX);
    setHoverTime(ratio * (duration || 0));
  };

  const handleMouseLeaveScrubber = () => {
    setHoverTime(null);
  };

  // Volume slider change
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      const muted = newVol === 0;
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
    resetControlsTimer();
  };

  // Quality selection (persisting on hlsInstanceRef.current.currentLevel)
  const handleSelectQuality = (levelIndex, e) => {
    if (e) e.stopPropagation();
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.currentLevel = levelIndex;
    }
    setCurrentQuality(levelIndex);
    setSelectedQuality(levelIndex);
    setActiveMenu(null);
    const chosen = qualityLevels.find((q) => q.index === levelIndex);
    showFeedback('quality', levelIndex === -1 ? 'Quality: Auto' : `Quality: ${chosen?.label || ''}`);
    resetControlsTimer();
  };

  // Speed selection
  const handleSelectSpeed = (speedValue, e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.playbackRate = speedValue;
    }
    setPlaybackSpeed(speedValue);
    setActiveMenu(null);
    showFeedback('speed', `${speedValue}x Speed`);
    resetControlsTimer();
  };

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  // Active quality label display
  const activeQualityDisplay =
    currentQuality === -1
      ? actualLevel >= 0 && qualityLevels[actualLevel]
        ? `Auto (${qualityLevels[actualLevel].label})`
        : 'Auto'
      : qualityLevels.find((q) => q.index === currentQuality)?.label || 'Quality';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-x-hidden w-full max-w-[100vw]"
      role="dialog"
      aria-modal="true"
    >
      {/* Main Cinema Player Container */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onTouchStart={resetControlsTimer}
        onMouseLeave={() => {
          if (isPlaying && !activeMenu) setShowControls(false);
        }}
        className={`relative w-full max-w-[100vw] sm:max-w-5xl bg-black flex flex-col overflow-hidden select-none transition-all duration-200 ${
          isFullscreen
            ? 'h-screen w-screen max-w-none rounded-none border-0'
            : 'rounded-none sm:rounded-xl bg-[#1E2024] border-0 sm:border border-[#353941] shadow-2xl'
        } ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
      >
        {/* Top Header Overlay */}
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
            paddingLeft: 'max(12px, env(safe-area-inset-left, 12px))',
            paddingRight: 'max(12px, env(safe-area-inset-right, 12px))',
          }}
          className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between pb-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
            showControls || !isPlaying
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2 sm:pr-4">
            <span className="text-[9px] sm:text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#1E2024]/90 border border-[#353941] text-[#7E57C2] shrink-0">
              {mode === 'trailer'
                ? 'Official Trailer'
                : mode === 'Footage'
                ? 'Behind the Lens'
                : 'Auteur Stream'}
            </span>
            <h3 className="text-white font-semibold text-xs sm:text-base truncate drop-shadow-md">
              {movie.title}
            </h3>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isFullscreen) {
                toggleFullscreen();
              } else {
                onClose();
              }
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className="text-white hover:text-[#7E57C2] p-1.5 sm:p-2 rounded-xl bg-black/60 sm:bg-black/40 border border-white/20 hover:bg-white/20 transition-all cursor-pointer shrink-0 shadow-lg active:scale-95"
            aria-label="Close cinema player"
            title="Close (Esc)"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div
          onClick={(e) => {
            if (e.target === videoRef.current) togglePlayPause();
          }}
          onDoubleClick={toggleFullscreen}
          className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${
            isFullscreen ? 'flex-1 h-full' : 'aspect-video'
          }`}
        >
          {/* Loading Stream Authorization State */}
          {isLoadingStream && !hasError && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#121316] text-[#B8BCC4] z-30 pointer-events-auto"
            >
              <div className="w-12 h-12 rounded-full border-3 border-[#353941] border-t-[#7E57C2] animate-spin mb-3" />
              <h4 className="text-white font-semibold text-sm sm:text-base mb-1">
                Authorizing Playback Stream...
              </h4>
              <p className="text-xs text-[#8A8F99]">
                Verifying secure credentials with Aspectt servers
              </p>
            </div>
          )}

          {/* Graceful Dark-Mode Error Screen */}
          {hasError ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#121316] text-[#B8BCC4] z-30"
            >
              <div className="w-14 h-14 rounded-full bg-[#1E2024] border border-[#353941] flex items-center justify-center mb-3 text-[#7E57C2]">
                <VideocamOutlinedIcon fontSize="large" />
              </div>
              <h4 className="text-white font-semibold text-base sm:text-lg mb-1">
                {streamError || 'Stream unavailable or processing'}
              </h4>
              <p className="text-xs text-[#8A8F99] max-w-sm mb-4">
                {streamError
                  ? 'Unable to authorize access to this protected stream. Please ensure you are logged in.'
                  : 'The video stream for this title is currently encoding, unavailable, or unreachable. Please try again later.'}
              </p>
              <div className="flex items-center gap-3">
                {streamUrl ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasError(false);
                      setRetryKey((k) => k + 1);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <ReplayIcon fontSize="small" />
                    <span>Retry</span>
                  </button>
                ) : null}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-[#282B30] hover:bg-[#353941] text-[#EDEDED] text-xs font-medium border border-[#353941] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}

          {/* Buffering Spinner */}
          {isBuffering && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-12 h-12 rounded-full border-3 border-[#353941] border-t-[#7E57C2] animate-spin" />
            </div>
          )}

          {/* Action Feedback Badge (Center Ripple) */}
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="flex flex-col items-center justify-center gap-1.5 w-24 h-24 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-white shadow-2xl">
                {feedback.type === 'play' && <PlayArrowIcon sx={{ fontSize: 36 }} />}
                {feedback.type === 'pause' && <PauseIcon sx={{ fontSize: 36 }} />}
                {feedback.type === 'forward' && <Forward10Icon sx={{ fontSize: 36 }} />}
                {feedback.type === 'rewind' && <Replay10Icon sx={{ fontSize: 36 }} />}
                {feedback.type === 'volume' && <VolumeUpIcon sx={{ fontSize: 36 }} />}
                {feedback.type === 'mute' && <VolumeOffIcon sx={{ fontSize: 36 }} />}
                {feedback.type === 'quality' && <SettingsIcon sx={{ fontSize: 36 }} />}
                {feedback.type === 'speed' && <SpeedIcon sx={{ fontSize: 36 }} />}
                <span className="text-[11px] font-semibold tracking-wide text-center px-1">
                  {feedback.label}
                </span>
              </div>
            </div>
          )}

          {/* Real Video Element (Controls suppressed in favor of custom UI) */}
          <video
            ref={videoRef}
            playsInline
            poster={movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster}
            className="w-full h-full object-contain bg-black"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) {
                setCurrentTime(video.currentTime);
                updateBuffered();
              }
            }}
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (video) setDuration(video.duration);
            }}
            onDurationChange={() => {
              const video = videoRef.current;
              if (video) setDuration(video.duration);
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onError={() => setHasError(true)}
          />

          {/* Custom Bottom Control Overlay Bar (Auto-Hides on Inactivity) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
              paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
              paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
            }}
            className={`absolute bottom-0 inset-x-0 z-20 flex flex-col gap-1.5 sm:gap-2.5 pt-12 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 ${
              showControls || !isPlaying
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Interactive Scrubber & Buffered Progress Bar */}
            <div
              ref={progressBarRef}
              onClick={(e) => {
                e.stopPropagation();
                handleSeek(e);
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseMove={handleMouseMoveScrubber}
              onMouseLeave={handleMouseLeaveScrubber}
              className="relative w-full h-1.5 sm:h-2 hover:h-2.5 bg-[#353941]/70 hover:bg-[#353941] rounded-full cursor-pointer transition-all group/scrubber flex items-center"
            >
              {/* Tooltip on hover */}
              {hoverTime !== null && duration > 0 && (
                <div
                  className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#1E2024] border border-[#353941] text-[10px] sm:text-[11px] font-mono text-white shadow-xl pointer-events-none z-20 whitespace-nowrap"
                  style={{
                    left: `${Math.max(
                      24,
                      Math.min((progressBarRef.current?.clientWidth || 300) - 24, hoverPosition)
                    )}px`,
                  }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* Buffered progress track */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/25 rounded-full transition-all"
                style={{ width: `${Math.min(100, bufferedPercent)}%` }}
              />

              {/* Played progress track */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#7E57C2] rounded-full"
                style={{ width: `${Math.min(100, playedPercent)}%` }}
              />

              {/* Scrubber thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-white shadow-md border border-[#7E57C2] transition-transform scale-100 sm:scale-0 sm:group-hover/scrubber:scale-100"
                style={{ left: `${Math.min(100, playedPercent)}%` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-[#B8BCC4] gap-1 sm:gap-2 pt-0.5 select-none w-full min-w-0">
              {/* Left Controls: Play/Pause, -10s, +10s, Volume, Time */}
              <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0 shrink">
                {/* Play / Pause Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="text-white hover:text-[#7E57C2] p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? (
                    <PauseIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
                  ) : (
                    <PlayArrowIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
                  )}
                </button>

                {/* Rewind -10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    seekRelative(-10);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="text-[#B8BCC4] hover:text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Rewind 10 seconds (Left Arrow)"
                  title="Rewind 10s (Left Arrow)"
                >
                  <Replay10Icon sx={{ fontSize: { xs: 18, sm: 21 } }} />
                </button>

                {/* Forward +10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    seekRelative(10);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="text-[#B8BCC4] hover:text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  aria-label="Forward 10 seconds (Right Arrow)"
                  title="Forward 10s (Right Arrow)"
                >
                  <Forward10Icon sx={{ fontSize: { xs: 18, sm: 21 } }} />
                </button>

                {/* Volume & Mute */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 shrink-0"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="text-[#B8BCC4] hover:text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeOffIcon sx={{ fontSize: { xs: 18, sm: 21 } }} />
                    ) : (
                      <VolumeUpIcon sx={{ fontSize: { xs: 18, sm: 21 } }} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Volume slider"
                    className="w-12 sm:w-16 h-1 bg-[#353941] rounded-lg appearance-none cursor-pointer accent-[#7E57C2] hidden md:block"
                  />
                </div>

                {/* Time Display */}
                <div className="font-mono text-[10px] sm:text-xs text-[#8A8F99] pl-0.5 sm:pl-1 whitespace-nowrap truncate shrink-0">
                  <span className="text-white">{formatTime(currentTime)}</span>
                  <span className="mx-0.5 sm:mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Quality Menu, Speed Menu, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* HLS Video Quality Selector Popover */}
                <div ref={qualityMenuRef} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === 'quality' ? null : 'quality');
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                      activeMenu === 'quality'
                        ? 'bg-[#7E57C2] border-[#7E57C2] text-white'
                        : 'border-[#353941] bg-[#1E2024]/80 text-[#B8BCC4] hover:text-white hover:border-[#4B505B]'
                    }`}
                    title="Video Quality"
                    aria-label="Video quality"
                  >
                    <SettingsIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                    <span className="hidden sm:inline">{activeQualityDisplay}</span>
                    <span className="sm:hidden">
                      {currentQuality === -1 ? 'Auto' : activeQualityDisplay}
                    </span>
                  </button>

                  {/* Quality Dropdown Menu */}
                  {activeMenu === 'quality' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full mb-3 right-0 w-36 bg-[#1E2024]/95 border border-[#353941] backdrop-blur-md rounded-xl shadow-2xl p-1.5 z-50 pointer-events-auto flex flex-col gap-0.5"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F99] border-b border-[#353941]/60 mb-1">
                        Resolution
                      </div>
                      <button
                        onClick={(e) => handleSelectQuality(-1, e)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                          currentQuality === -1
                            ? 'bg-[#7E57C2]/20 text-[#7E57C2]'
                            : 'text-[#B8BCC4] hover:bg-[#282B30] hover:text-white'
                        }`}
                      >
                        <span>Auto</span>
                        {currentQuality === -1 && (
                          <span className="text-[10px] font-mono text-[#7E57C2]">
                            {actualLevel >= 0 && qualityLevels[actualLevel]
                              ? qualityLevels[actualLevel].label
                              : 'Optimal'}
                          </span>
                        )}
                      </button>
                      {qualityLevels.map((lvl) => (
                        <button
                          key={lvl.index}
                          onClick={(e) => handleSelectQuality(lvl.index, e)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            currentQuality === lvl.index
                              ? 'bg-[#7E57C2]/20 text-[#7E57C2]'
                              : 'text-[#B8BCC4] hover:bg-[#282B30] hover:text-white'
                          }`}
                        >
                          <span>{lvl.label}</span>
                          {currentQuality === lvl.index && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          )}
                        </button>
                      ))}
                      {qualityLevels.length === 0 && (
                        <div className="px-2.5 py-1.5 text-[11px] text-[#8A8F99]">
                          Master Source (Direct)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Playback Speed Menu */}
                <div ref={speedMenuRef} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === 'speed' ? null : 'speed');
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                      activeMenu === 'speed'
                        ? 'bg-[#7E57C2] border-[#7E57C2] text-white'
                        : 'border-[#353941] bg-[#1E2024]/80 text-[#B8BCC4] hover:text-white hover:border-[#4B505B]'
                    }`}
                    title="Playback Speed"
                    aria-label="Playback speed"
                  >
                    <SpeedIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                    <span>{playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}</span>
                  </button>

                  {/* Speed Dropdown Menu */}
                  {activeMenu === 'speed' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full mb-3 right-0 w-32 bg-[#1E2024]/95 border border-[#353941] backdrop-blur-md rounded-xl shadow-2xl p-1.5 z-50 pointer-events-auto flex flex-col gap-0.5"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F99] border-b border-[#353941]/60 mb-1">
                        Speed
                      </div>
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={(e) => handleSelectSpeed(speed, e)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                            playbackSpeed === speed
                              ? 'bg-[#7E57C2]/20 text-[#7E57C2]'
                              : 'text-[#B8BCC4] hover:bg-[#282B30] hover:text-white'
                          }`}
                        >
                          <span>{speed === 1 ? '1x (Normal)' : `${speed}x`}</span>
                          {playbackSpeed === speed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="text-[#B8BCC4] hover:text-white p-0.5 sm:p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5"
                  aria-label={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                >
                  {isFullscreen ? (
                    <FullscreenExitIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  ) : (
                    <FullscreenIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Metadata Footer (Hidden during edge-to-edge fullscreen) */}
        {!isFullscreen && (
          <div className="p-3 sm:p-4 bg-[#1E2024] border-t border-[#353941] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#B8BCC4] max-w-full overflow-hidden">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="text-white font-medium truncate">{movie.title}</span>
              <span className="shrink-0">({movie.year || movie.releaseYear || 2024})</span>
              {movie.director || movie.filmmakerName ? (
                <span className="text-[#8A8F99] truncate">
                  • Directed by {movie.director || movie.filmmakerName}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded border border-[#353941] text-[#7E57C2] font-mono">
                {isM3u8 ? 'HLS ADAPTIVE' : 'DIRECT MP4'}
              </span>
              {movie.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[10px] sm:text-xs px-2 py-0.5 bg-[#282B30] border border-[#353941] rounded text-[#B8BCC4]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
