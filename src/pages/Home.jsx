import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { movies as mockMovies } from '../data/movies';
import { FOOTAGE_ITEMS as mockFootage } from '../data/footages';
import { moviesApi, behindTheLensApi, submissionsApi } from '../api/client';
import MovieCard from '../components/MovieCard';
import HeroSlider from '../components/HeroSlider';
import PlayerModal from '../components/PlayerModal';
import FilmSubmissionModal from '../components/FilmSubmissionModal';
import FootageStackSlider from '../components/FootageStackSlider';
import {
  MovieCardSkeleton,
  HeroSliderSkeleton,
  FootageCardSkeleton,
} from '../components/Skeletons';
import { useWatchlist } from '../context/WatchlistContext';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TheatersOutlinedIcon from '@mui/icons-material/TheatersOutlined';
import MovieCreationOutlinedIcon from '@mui/icons-material/MovieCreationOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CircularProgress from '@mui/material/CircularProgress';

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useWatchlist();

  // Live API States with fallback to curated data
  const [heroMovies, setHeroMovies] = useState([]);
  const [catalogMovies, setCatalogMovies] = useState([]);
  const [footageClips, setFootageClips] = useState([]);

  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingFootage, setIsLoadingFootage] = useState(true);

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Auto-open submission modal if navigated with #screener-submission
  useEffect(() => {
    if (window.location.hash === '#screener-submission') {
      setIsSubmitModalOpen(true);
    }
  }, []);

  // 1. Fetch Hero Featured Movies (/api/movies/hero)
  useEffect(() => {
    let isMounted = true;
    async function loadHero() {
      try {
        const list = await moviesApi.getHero();
        if (isMounted) {
          if (list && list.length > 0) {
            setHeroMovies(list);
          } else {
            setHeroMovies(mockMovies.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn('Hero movies fetch fallback to local:', err.message);
        if (isMounted) setHeroMovies(mockMovies.slice(0, 4));
      } finally {
        if (isMounted) setIsLoadingHero(false);
      }
    }
    loadHero();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Curated Catalog Movies (/api/movies?curated=true)
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const list = await moviesApi.getAll({ curated: true });
        if (isMounted) {
          if (list && list.length > 0) {
            setCatalogMovies(list);
          } else {
            setCatalogMovies([]);
          }
        }
      } catch (err) {
        console.warn('Catalog fetch fallback to local:', err.message);
        if (isMounted) setCatalogMovies(mockMovies.filter((m) => m.featured || m.isCurated));
      } finally {
        if (isMounted) setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Behind The Lens Clips (/api/behind-the-lens)
  useEffect(() => {
    let isMounted = true;
    async function loadFootage() {
      try {
        const list = await behindTheLensApi.getAll();
        if (isMounted) {
          if (list && list.length > 0) {
            setFootageClips(list);
          } else {
            setFootageClips(mockFootage);
          }
        }
      } catch (err) {
        console.warn('Behind-the-lens fetch fallback to local:', err.message);
        if (isMounted) setFootageClips(mockFootage);
      } finally {
        if (isMounted) setIsLoadingFootage(false);
      }
    }
    loadFootage();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleWatchClip = (clip) => {
    setActiveClip(clip);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setActiveClip(null);
  };

  // 4 Featured movies for Hero Slider
  const featuredMovies = heroMovies.length > 0 ? heroMovies.slice(0, 4) : mockMovies.slice(0, 4);
  const featuredMovie = featuredMovies[0];

  // Latest 4 footage clips for Home page row & mobile stack deck
  const latestClips = footageClips.length > 0 ? footageClips.slice(0, 4) : mockFootage.slice(0, 4);

  // Playback item
  const currentPlaybackItem = activeClip
    ? {
        title: activeClip.title,
        duration: activeClip.duration,
        director: activeClip.filmmakerName || activeClip.director,
        backdrop: activeClip.thumbnailUrl || activeClip.image,
        poster: activeClip.thumbnailUrl || activeClip.image,
        year: 2024,
        genres: ['Behind the Lens', 'Raw Footage'],
        videoStreamUrl: activeClip.clipUrl,
      }
    : featuredMovie;

  return (
    <div className="min-h-screen bg-[#1E2024] pb-20">
      {/* 3D Stacked Deck Hero Slider Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5">
        {isLoadingHero ? (
          <HeroSliderSkeleton />
        ) : (
          <HeroSlider featuredMovies={featuredMovies} />
        )}
      </section>

      {/* 1. The Aspectt Promise Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="bg-[#282B30] border border-[#353941] rounded-xl p-6 sm:p-8 lg:p-9 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-center">
            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                The Aspectt Promise
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#7E57C2]">
                Cinema, Exactly as It Was Meant to Be Experienced.
              </p>
              <p className="text-xs sm:text-sm text-[#B8BCC4] leading-relaxed">
                Aspectt is a dedicated sanctuary for handpicked independent cinema, international festival selections, and rare auteur gems. Every film in our catalog is chosen with care by real humans who deeply love the craft—never by an algorithm. We preserve every title in its true, director-intended aspect ratio and stream it from opening frame to final credit without a single commercial interruption.
              </p>
              <p className="text-xs sm:text-sm text-[#EDEDED] font-medium pt-1">
                Step into a quieter, richer way to watch. Join Aspectt today and discover your next unforgettable film.
              </p>
            </div>

            {/* Right Value Pillars (1/3 width) */}
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3 w-full">
              <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#7E57C2] flex-shrink-0">
                  <MovieCreationOutlinedIcon sx={{ fontSize: 16 }} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">100% Human-Curated</h4>
                  <p className="text-[11px] text-[#8A8F99] leading-snug">
                    Thoughtfully selected by real people with a passion for meaningful storytelling—never generated by automated feeds.
                  </p>
                </div>
              </div>

              <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#7E57C2] flex-shrink-0">
                  <TheatersOutlinedIcon sx={{ fontSize: 16 }} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">True Aspect & Festival Cuts</h4>
                  <p className="text-[11px] text-[#8A8F99] leading-snug">
                    Rare festival selections and uncompromised visions, presented in the exact framing and visual fidelity the creators intended.
                  </p>
                </div>
              </div>

              <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-[#282B30] border border-[#353941] flex items-center justify-center text-[#7E57C2] flex-shrink-0">
                  <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Uninterrupted Immersion</h4>
                  <p className="text-[11px] text-[#8A8F99] leading-snug">
                    Zero mid-roll ads breaking the mood—just pure, continuous cinema from start to finish.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Movies Grid Section (Curated Catalog) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <div className="mb-4 border-b border-[#353941] pb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Curated Catalog
            </h2>
            <p className="text-xs text-[#8A8F99] mt-0.5">
              Current festival repertoire & independent releases streaming worldwide.
            </p>
          </div>
          <span className="text-xs text-[#8A8F99] font-mono hidden sm:inline">
            {catalogMovies.length} Titles
          </span>
        </div>

        {/* Responsive Grid with Matte #282B30 Skeletons */}
        {isLoadingCatalog ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-4.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-4.5">
            {catalogMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* 2. Independent Filmmakers' Footages (Behind the Lens) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-18">
        <div className="mb-5 border-b border-[#353941] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <VideocamOutlinedIcon sx={{ fontSize: 18 }} className="text-[#7E57C2]" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7E57C2]">
                Production Archives
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Behind the Lens
            </h2>
            <p className="text-xs text-[#8A8F99] mt-0.5">
              Raw production footage, director diaries, and unreleased b-roll straight from independent sets.
            </p>
          </div>

          <button
            onClick={() => navigate('/behind-the-lens')}
            className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-[#282B30] hover:bg-[#353941] border border-[#353941] hover:border-[#7E57C2] text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer group"
          >
            <span>All clips</span>
            <ArrowForwardIcon
              sx={{ fontSize: 15 }}
              className="text-[#7E57C2] group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>

        {/* Mobile: 3D Stack Card Deck with Swipe */}
        <div className="block sm:hidden">
          {isLoadingFootage ? (
            <FootageCardSkeleton />
          ) : (
            <FootageStackSlider clips={latestClips} onWatchClip={handleWatchClip} />
          )}
        </div>

        {/* Desktop / Tablet: Responsive 4-Column Card Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingFootage
            ? Array.from({ length: 4 }).map((_, i) => <FootageCardSkeleton key={i} />)
            : latestClips.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden hover:border-[#7E57C2]/60 transition-all duration-200 group flex flex-col justify-between"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-[#1E2024] overflow-hidden">
                    <img
                      src={item.thumbnailUrl || item.image}
                      alt={item.filmmakerName || item.director}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Duration Badge */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-white border border-[#353941]">
                      {item.duration}
                    </span>

                    {/* Camera Note Pill */}
                    {item.cameraNote && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/85 text-[10px] font-medium text-[#7E57C2] border border-[#353941]">
                        {item.cameraNote}
                      </span>
                    )}

                    {/* Center Play Watermark */}
                    <div
                      onClick={() => handleWatchClip(item)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#7E57C2] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <PlayArrowIcon fontSize="small" />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
                    <p className="text-xs sm:text-sm text-[#B8BCC4] truncate">
                      Directed by{' '}
                      <strong className="text-white font-medium">
                        {item.filmmakerName || item.director}
                      </strong>
                    </p>

                    {/* Play Button */}
                    <button
                      onClick={() => handleWatchClip(item)}
                      className="w-full py-2 px-2.5 sm:px-3 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] active:bg-[#512DA8] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-none"
                    >
                      <PlayArrowIcon sx={{ fontSize: 15 }} className="text-white" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* 3. "How to Submit a Film on Aspectt" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-18">
        <div className="bg-[#282B30] border border-[#353941] rounded-xl p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7E57C2] block mb-1.5">
              Creator Submissions & Distribution
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Submit Your Film to Aspectt
            </h2>
            <p className="text-xs sm:text-sm text-[#B8BCC4] mt-2 leading-relaxed">
              Are you an independent filmmaker, festival distributor, or documentarian? We invite
              bold, auteur-driven cinema from creators worldwide. Aspectt provides an ad-free global
              platform with transparent creator revenue share.
            </p>
          </div>

          {/* 3-Step Guide Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-4 sm:p-4.5 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#282B30] border border-[#353941] text-[#7E57C2] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                01
              </span>
              <h4 className="text-sm font-semibold text-white">Screener Link</h4>
            </div>

            <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-4 sm:p-4.5 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#282B30] border border-[#353941] text-[#7E57C2] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                02
              </span>
              <h4 className="text-sm font-semibold text-white">Curated Review</h4>
            </div>

            <div className="bg-[#1E2024] border border-[#353941] rounded-lg p-4 sm:p-4.5 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#282B30] border border-[#353941] text-[#7E57C2] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                03
              </span>
              <h4 className="text-sm font-semibold text-white">Premiere on Aspectt</h4>
            </div>
          </div>

          {/* Submission Action Callout */}
          <div className="mt-8 pt-6 border-t border-[#353941] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#8A8F99]">
              <span>
                Submissions open for features, shorts, documentaries, and experimental works.
              </span>
              <span className="block text-[11px] text-[#B8BCC4] mt-0.5">
                Direct curatorial inquiries:{' '}
                <strong className="text-white font-mono">curators@aspectt.stream</strong>
              </span>
            </div>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer shadow-md flex-shrink-0"
            >
              <SendOutlinedIcon sx={{ fontSize: 16 }} />
              <span>Submit Your Film</span>
            </button>
          </div>
        </div>
      </section>

      {/* Film Submission Dialog Modal (Connected to POST /api/submissions) */}
      <FilmSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* Playback Simulation Modal */}
      <PlayerModal
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
        movie={currentPlaybackItem}
        mode={activeClip ? 'Footage' : 'feature'}
      />
    </div>
  );
}
