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
    const person = (clip.personName || clip.filmmakerName || clip.director || '').toLowerCase();
    const role = (clip.role || '').toLowerCase();
    const title = (clip.title || clip.film || '').toLowerCase();
    const details = (clip.details || clip.cameraNote || '').toLowerCase();
    return person.includes(q) || role.includes(q) || title.includes(q) || details.includes(q);
  });

  const handleWatchClip = (clip) => {
    setSelectedClip(clip);
  };

  const handleClosePlayer = () => {
    setSelectedClip(null);
  };

  const currentPlaybackItem = selectedClip
    ? {
        ...selectedClip,
        title: selectedClip.title || '',
        personName: selectedClip.personName || selectedClip.filmmakerName || selectedClip.director,
        role: selectedClip.role || 'Filmmaker',
        details: selectedClip.details || selectedClip.cameraNote || '',
        filmography: selectedClip.filmography || '',
        duration: selectedClip.duration || '3m 00s',
        director: selectedClip.personName || selectedClip.filmmakerName || selectedClip.director,
        backdrop: selectedClip.thumbnailUrl || selectedClip.image,
        poster: selectedClip.thumbnailUrl || selectedClip.image,
        year: 2024,
        genres: [selectedClip.role || 'Behind the Lens'],
        videoStreamUrl: selectedClip.videoUrl || selectedClip.clipUrl,
        clipUrl: selectedClip.videoUrl || selectedClip.clipUrl,
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
                  Production Archives & Interviews
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Behind the Lens
              </h1>
              <p className="text-xs sm:text-sm text-[#8A8F99] mt-2 leading-relaxed">
                Interviews, craft diaries, and raw reels for filmmakers, actors, cinematographers,
                sound designers, and production teams across independent cinema.
              </p>
            </div>

            {/* Action Bar: Search Input & Total Count Pill */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <SearchIcon
                  sx={{ fontSize: 18 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F99]"
                />
                <input
                  type="text"
                  placeholder="Filter by artist, role, movie..."
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
            {filteredClips.map((item) => {
              const person = item.personName || item.filmmakerName || item.director || 'Artist';
              const role = item.role || 'Filmmaker';

              return (
                <div
                  key={item.id}
                  className="group bg-[#282B30] border border-[#353941] rounded-xl overflow-hidden hover:border-[#7E57C2]/60 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Clean Thumbnail Container (No text/badges or edit buttons overlaid) */}
                  <div
                    onClick={() => handleWatchClip(item)}
                    className="relative aspect-video w-full bg-[#1E2024] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.thumbnailUrl || item.image}
                      alt={`${role} : ${person}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Center Play Watermark Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-[#7E57C2] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <PlayArrowIcon fontSize="small" />
                      </div>
                    </div>
                  </div>

                  {/* Clean Content Details Underneath */}
                  <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                    <div>
                      {/* {clip.role} : {clip.personName} */}
                      <h3
                        className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#7E57C2] transition-colors"
                        title={`${role} : ${person}`}
                      >
                        <span className="text-[#8A8F99] font-normal">{role} : </span>
                        <span className="text-white font-medium">{person}</span>
                      </h3>

                      {/* Optional Title (if provided) */}
                      {item.title && item.title.trim() && (
                        <p
                          className="text-xs text-[#B8BCC4] mt-1 line-clamp-1"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                      )}
                    </div>

                    {/* Play Button */}
                    <button
                      onClick={() => handleWatchClip(item)}
                      className="w-full py-2 px-3 rounded-lg bg-[#1E2024] hover:bg-[#7E57C2] border border-[#353941] hover:border-[#7E57C2] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlayArrowIcon sx={{ fontSize: 15 }} />
                      <span>Watch Clip</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
