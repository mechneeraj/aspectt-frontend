import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MovieIcon from '@mui/icons-material/Movie';
import ShareIcon from '@mui/icons-material/Share';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { getMovieById } from '../data/movies';
import { moviesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import PlayerModal from '../components/PlayerModal';
import { MovieDetailsSkeleton } from '../components/Skeletons';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerState, setPlayerState] = useState({ isOpen: false, mode: 'feature' });

  const { isInWatchlist, toggleWatchlist, showToast } = useWatchlist();
  const {
    isAuthenticated,
    isSubscribed,
    openAuthModal,
    pendingPlayback,
    setPendingPlayback,
    clearPendingPlayback,
  } = useAuth();

  // Fetch /api/movies/:id by route ID
  useEffect(() => {
    let isMounted = true;
    async function loadMovie() {
      setIsLoading(true);
      try {
        const liveMovie = await moviesApi.getById(id);
        if (isMounted && liveMovie) {
          setMovie(liveMovie);
        } else if (isMounted) {
          setMovie(getMovieById(id));
        }
      } catch (err) {
        console.warn('Live movie details fetch error, using fallback:', err.message);
        if (isMounted) {
          setMovie(getMovieById(id));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMovie();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle ?play=true query param or post-login auto-launch for this film
  useEffect(() => {
    if (!movie) return;

    const queryParams = new URLSearchParams(location.search);
    const shouldAutoPlay = queryParams.get('play') === 'true' || queryParams.get('autoplay') === 'true';

    const isPendingThisMovie =
      pendingPlayback &&
      (pendingPlayback === movie.id ||
        pendingPlayback.id === movie.id ||
        pendingPlayback === movie.slug ||
        pendingPlayback.slug === movie.slug);

    if (shouldAutoPlay || isPendingThisMovie) {
      const moviePayload = movie ? { id: movie.id, title: movie.title, slug: movie.slug } : movie;
      if (!isAuthenticated) {
        setPendingPlayback(moviePayload);
        openAuthModal('login', 'Sign in or create a free account to watch films on Aspectt.');
      } else if (!isSubscribed) {
        setPendingPlayback(moviePayload);
        navigate('/subscription');
      } else {
        if (isPendingThisMovie) clearPendingPlayback();
        setPlayerState({ isOpen: true, mode: 'feature' });
      }
    }
  }, [movie, location.search, isAuthenticated, isSubscribed, pendingPlayback, clearPendingPlayback, setPendingPlayback, openAuthModal, navigate]);

  const handlePlayClick = () => {
    const moviePayload = movie ? { id: movie.id, title: movie.title, slug: movie.slug } : movie;
    if (!isAuthenticated) {
      setPendingPlayback(moviePayload);
      openAuthModal('login', 'Sign in or create a free account to watch films on Aspectt.');
      return;
    }
    if (!isSubscribed) {
      setPendingPlayback(moviePayload);
      navigate('/subscription');
      return;
    }
    setPlayerState({ isOpen: true, mode: 'feature' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1E2024] pb-12 sm:pb-16 pt-6 sm:pt-10">
        <MovieDetailsSkeleton />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#1E2024]">
        <div className="bg-[#282B30] border border-[#353941] p-8 rounded max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-2">Movie Not Found</h2>
          <p className="text-sm text-[#B8BCC4] mb-6">
            The film you are searching for does not exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded bg-transparent hover:bg-[#7E57C2]/15 text-white border border-[#7E57C2] text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isSaved = isInWatchlist(movie.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#1E2024] pb-12 sm:pb-16 pt-6 sm:pt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Film Poster & Details Card */}
        <div className="bg-[#282B30] border border-[#353941] rounded-xl sm:rounded-2xl overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: High-resolution Film Poster (2:3 aspect ratio) with round corners */}
            <div className="md:col-span-5 lg:col-span-4 flex justify-center">
              <div className="w-full max-w-xs aspect-poster bg-[#1E2024] border border-[#353941] rounded-xl sm:rounded-2xl overflow-hidden select-none">
                <img
                  src={movie.posterUrl || movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Column: Movie Details */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col space-y-6">
              {/* Header: Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {movie.title}
                </h1>

                {/* Metadata Row: Release Year, Duration, Rating badge */}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#B8BCC4]">
                  <span className="font-semibold text-white">{movie.year || movie.releaseYear}</span>
                  <span className="w-1 h-1 rounded-full bg-[#454A54]" />
                  <span>{movie.duration}</span>
                  <span className="w-1 h-1 rounded-full bg-[#454A54]" />
                  <span className="text-xs px-2 py-0.5 rounded border border-[#353941] text-[#B8BCC4] uppercase font-mono">
                    HD
                  </span>
                  {movie.awardTag && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[#454A54]" />
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1E2024] border border-[#353941] text-[#7E57C2] font-medium">
                        {movie.awardTag}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Tags (Soft Ash Gray matte pills) */}
              <div className="flex flex-wrap items-center gap-2">
                {movie.genres?.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-[#1E2024] border border-[#353941] text-[#B8BCC4] text-xs font-medium rounded tracking-wide"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Action Buttons: Play (Matte Purple), Watchlist (wired to POST /user/watchlist/:movieId), Trailer */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Matte Purple "Play" Button with Authentication Gate */}
                <button
                  onClick={handlePlayClick}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-[#7E57C2] hover:bg-[#673AB7] active:bg-[#512DA8] text-white font-semibold text-sm tracking-wide transition-colors cursor-pointer"
                >
                  <PlayArrowIcon fontSize="small" />
                  <span>Play</span>
                </button>

                {/* Secondary Soft Ash Gray "Watchlist" Button */}
                <button
                  onClick={() => toggleWatchlist(movie.id, movie.title)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border text-sm font-medium transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#353941] text-[#7E57C2] border-[#7E57C2]'
                      : 'bg-[#282B30] text-white border-[#353941] hover:bg-[#353941]'
                  }`}
                >
                  {isSaved ? (
                    <BookmarkIcon fontSize="small" />
                  ) : (
                    <BookmarkBorderIcon fontSize="small" />
                  )}
                  <span>{isSaved ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

                {/* Secondary Soft Ash Gray "Trailer" Button */}
                <button
                  onClick={() => setPlayerState({ isOpen: true, mode: 'trailer' })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#282B30] hover:bg-[#353941] text-white border border-[#353941] text-sm font-medium transition-colors cursor-pointer"
                >
                  <MovieIcon fontSize="small" className="text-[#B8BCC4]" />
                  <span>Trailer</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded bg-[#282B30] hover:bg-[#353941] text-[#B8BCC4] hover:text-white border border-[#353941] transition-colors cursor-pointer"
                  title="Share film"
                  aria-label="Share"
                >
                  <ShareIcon fontSize="small" />
                </button>
              </div>

              {/* Director Name */}
              <div className="border-t border-[#353941] pt-4">
                <span className="text-xs uppercase tracking-wider text-[#8A8F99] font-semibold block mb-1">
                  Director
                </span>
                <span className="text-white text-sm font-medium">{movie.director}</span>
              </div>

              {/* Full Description / Synopsis */}
              <div className="border-t border-[#353941] pt-4">
                <span className="text-xs uppercase tracking-wider text-[#8A8F99] font-semibold block mb-2">
                  Synopsis
                </span>
                <p className="text-xs sm:text-sm text-[#B8BCC4] leading-relaxed">
                  {movie.description}
                </p>
              </div>
            </div>
          </div>

          {/* Director's Note & Curatorial Take Section */}
          <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-[#353941] grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Director's Note Column */}
            <div className="bg-[#1E2024] border border-[#353941] rounded-xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#7E57C2]">
                    <FormatQuoteIcon fontSize="small" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Director's Note
                    </h3>
                    <span className="text-[11px] text-[#8A8F99]">
                      By {movie.director}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#B8BCC4] italic leading-relaxed">
                  "{movie.directorsNote ||
                    'Every frame of this film was crafted to preserve the authentic emotional gravity of independent storytelling without studio interference.'}"
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-[#353941]/60 flex items-center justify-between text-[11px] text-[#8A8F99]">
                <span>Archival Statement</span>
                <span className="text-[#7E57C2] font-mono">16mm / Super 35mm</span>
              </div>
            </div>

            {/* Curator's Take Column */}
            <div className="bg-[#1E2024] border border-[#353941] rounded-xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#7E57C2]">
                      <AutoAwesomeOutlinedIcon fontSize="small" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Curator's Take
                      </h3>
                      <span className="text-[11px] text-[#8A8F99]">
                        Aspectt Curation Board
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#282B30] border border-[#353941] text-[#7E57C2]">
                    Editorial Selection
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#B8BCC4] leading-relaxed">
                  {movie.curatorsTake ||
                    'Selected by the Aspectt curatorial board for its uncompromising cinematic voice, stunning technical restraint, and enduring emotional impact.'}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-[#353941]/60 flex items-center justify-between text-[11px] text-[#8A8F99]">
                <span>Handpicked Festival Selection</span>
                <span className="text-[#7E57C2] font-semibold">Verified Auteur Cut</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video / Trailer Player Modal passing videoStreamUrl */}
      <PlayerModal
        isOpen={playerState.isOpen}
        onClose={() => setPlayerState({ isOpen: false, mode: 'feature' })}
        movie={{
          ...movie,
          videoStreamUrl: movie.videoStreamUrl || movie.streamUrl,
        }}
        mode={playerState.mode}
      />
    </div>
  );
}
