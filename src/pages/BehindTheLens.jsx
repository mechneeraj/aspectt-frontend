import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FOOTAGE_ITEMS as mockFootage } from '../data/footages';
import { behindTheLensApi } from '../api/client';
import PlayerModal from '../components/PlayerModal';
import { FootageCardSkeleton } from '../components/Skeletons';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import SearchIcon from '@mui/icons-material/Search';

export default function BehindTheLens() {
  const navigate = useNavigate();
  const [clips, setClips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClip, setSelectedClip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch /api/behind-the-lens
  useEffect(() => {
    let isMounted = true;
    async function loadFootage() {
      setIsLoading(true);
      try {
        const liveClips = await behindTheLensApi.getAll();
        if (isMounted) {
          if (liveClips && liveClips.length > 0) {
            setClips(liveClips);
          } else {
            setClips(mockFootage);
          }
        }
      } catch (err) {
        console.warn('BehindTheLens fetch fallback to mock:', err.message);
        if (isMounted) setClips(mockFootage);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFootage();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredClips = clips.filter((clip) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const dir = (clip.director || clip.filmmakerName || '').toLowerCase();
    const flm = (clip.film || clip.title || '').toLowerCase();
    const ttl = (clip.title || '').toLowerCase();
    return dir.includes(q) || flm.includes(q) || ttl.includes(q);
  });

  const handleWatchClip = (clip) => {
    setSelectedClip(clip);
  };

  const handleClosePlayer = () => {
    setSelectedClip(null);
  };

  const currentPlaybackItem = selectedClip
    ? {
        title: selectedClip.title,
        duration: selectedClip.duration,
        director: selectedClip.filmmakerName || selectedClip.director,
        backdrop: selectedClip.thumbnailUrl || selectedClip.image,
        poster: selectedClip.thumbnailUrl || selectedClip.image,
        year: 2024,
        videoStreamUrl: selectedClip.clipUrl,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#1E2024] text-white pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#8A8F99] hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowBackIcon
              sx={{ fontSize: 16 }}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-[#282B30] border border-[#353941] rounded-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <VideocamOutlinedIcon sx={{ fontSize: 20 }} className="text-[#7E57C2]" />
                <span className="text-xs uppercase tracking-wider font-semibold text-[#7E57C2]">
                  Production Archives
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Behind the Lens
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8F99] mt-2 leading-relaxed">
                Raw production footage, director diaries, and unreleased reels straight from
                independent sets across our curated catalog.
              </p>
            </div>

            {/* Search Input & Total Count Pill */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <SearchIcon
                  sx={{ fontSize: 18 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F99]"
                />
                <input
                  type="text"
                  placeholder="Filter by director..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-60 pl-9 pr-3 py-1.5 rounded-lg bg-[#1E2024] border border-[#353941] text-xs text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
                />
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-[#1E2024] border border-[#353941] text-xs font-mono text-[#8A8F99] text-center whitespace-nowrap">
                {filteredClips.length} {filteredClips.length === 1 ? 'Clip' : 'Clips'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading Skeletons or Clips Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <FootageCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredClips.length === 0 ? (
          <div className="bg-[#282B30] border border-[#353941] rounded-xl p-12 text-center">
            <p className="text-sm text-[#8A8F99]">No footage found matching your search.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-[#7E57C2] hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredClips.map((item) => (
              <div
                key={item.id}
                className="group bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden hover:border-[#4E535E] transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-[#1E2024] overflow-hidden">
                  <img
                    src={item.thumbnailUrl || item.image}
                    alt={item.filmmakerName || item.director}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E2024] via-transparent to-transparent pointer-events-none" />

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 border border-[#353941] text-[11px] font-mono text-white">
                    {item.duration}
                  </span>

                  {/* Camera Note Pill */}
                  {item.cameraNote && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#353941] text-[10px] font-medium text-[#7E57C2]">
                      {item.cameraNote}
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#7E57C2] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#8A8F99] mt-1">
                      Filmmaker:{' '}
                      <strong className="text-[#B8BCC4] font-medium">
                        {item.filmmakerName || item.director}
                      </strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleWatchClip(item)}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-[#1E2024] hover:bg-[#7E57C2] border border-[#353941] hover:border-[#7E57C2] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlayArrowIcon sx={{ fontSize: 15 }} />
                    <span>Watch Footage</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {selectedClip && (
          <PlayerModal
            isOpen={Boolean(selectedClip)}
            onClose={handleClosePlayer}
            movie={currentPlaybackItem}
            mode="Footage"
          />
        )}
      </div>
    </div>
  );
}
