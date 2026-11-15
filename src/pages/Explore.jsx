import React, { useState, useEffect, useMemo } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { movies as mockMovies, getAllGenres, getAllYears } from '../data/movies';
import { moviesApi } from '../api/client';
import MovieCard from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/Skeletons';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  const [moviesList, setMoviesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch /api/movies with search, genre, and year query params dynamically
  useEffect(() => {
    let isMounted = true;
    async function fetchFilteredMovies() {
      setIsLoading(true);
      try {
        const data = await moviesApi.getAll({
          search: debouncedSearch,
          genre: selectedGenre,
          year: selectedYear,
        });

        if (isMounted) {
          setMoviesList(data);
        }
      } catch (err) {
        console.warn('Live filter fetch error, using client fallback:', err.message);
        if (isMounted) {
          // Fallback client filter
          const fallback = mockMovies.filter((movie) => {
            const matchesSearch =
              !debouncedSearch.trim() ||
              movie.title.toLowerCase().includes(debouncedSearch.trim().toLowerCase()) ||
              movie.director?.toLowerCase().includes(debouncedSearch.trim().toLowerCase());
            const matchesGenre =
              selectedGenre === 'All' || movie.genres?.includes(selectedGenre);
            const matchesYear =
              selectedYear === 'All' || String(movie.year) === selectedYear;
            return matchesSearch && matchesGenre && matchesYear;
          });
          setMoviesList(fallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchFilteredMovies();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedGenre, selectedYear]);

  // Extract available genres and years
  const genres = useMemo(() => {
    const list = getAllGenres();
    return list;
  }, []);

  const years = useMemo(() => {
    const list = getAllYears();
    return list;
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedGenre('All');
    setSelectedYear('All');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedGenre !== 'All' || selectedYear !== 'All';

  return (
    <div className="min-h-screen bg-[#1E2024] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Description */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Explore Titles
          </h1>
          <p className="text-sm text-[#B8BCC4] mt-1">
            Browse the full catalog with instant real-time search and filter controls.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#282B30] border border-[#353941] rounded-md p-4 sm:p-5 mb-8 space-y-4">
          {/* Top: Search Input */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8F99]">
              <SearchIcon fontSize="small" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies by title or director..."
              className="w-full bg-[#1E2024] border border-[#353941] rounded pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8A8F99] focus:outline-none focus:border-[#7E57C2] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-[#B8BCC4] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Bottom: Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#B8BCC4] font-medium uppercase tracking-wider flex-shrink-0">
                <FilterListIcon fontSize="small" className="text-[#7E57C2]" />
                <span>Filters:</span>
              </div>

              {/* Genre Dropdown */}
              <div className="relative flex-1 sm:flex-initial min-w-0">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full sm:w-auto bg-[#1E2024] border border-[#353941] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7E57C2] cursor-pointer truncate"
                  aria-label="Filter by genre"
                >
                  <option value="All">All Genres</option>
                  {genres
                    .filter((g) => g !== 'All')
                    .map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                </select>
              </div>

              {/* Release Year Dropdown */}
              <div className="relative flex-1 sm:flex-initial min-w-0">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full sm:w-auto bg-[#1E2024] border border-[#353941] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7E57C2] cursor-pointer truncate"
                  aria-label="Filter by release year"
                >
                  <option value="All">All Years</option>
                  {years
                    .filter((y) => y !== 'All')
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
              </div>

              {/* Mobile Reset button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex sm:hidden items-center justify-center p-1.5 rounded bg-[#1E2024] hover:bg-[#353941] border border-[#353941] text-[#B8BCC4] hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                  title="Reset Filters"
                  aria-label="Reset Filters"
                >
                  <RestartAltIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>

            {/* Desktop Reset button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 text-xs text-[#B8BCC4] hover:text-white px-2.5 py-1.5 rounded hover:bg-[#353941] border border-transparent hover:border-[#353941] transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RestartAltIcon fontSize="small" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8A8F99] font-mono">
              {moviesList.length} results found
            </span>
            <span className="text-xs text-[#7E57C2] font-medium">Filtered results</span>
          </div>
        )}

        {/* Loading Skeletons or Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-4.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : moviesList.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-4.5">
            {moviesList.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-[#282B30] border border-[#353941] rounded-md p-12 text-center max-w-lg mx-auto my-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded bg-[#1E2024] border border-[#353941] flex items-center justify-center text-[#B8BCC4]">
              <SearchIcon fontSize="medium" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No movies found</h3>
            <p className="text-sm text-[#B8BCC4] mb-6">
              We couldn't find any titles matching your current search criteria. Try adjusting
              keywords or clearing the genre and year filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2 rounded bg-[#7E57C2] hover:bg-[#673AB7] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <RestartAltIcon fontSize="small" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
