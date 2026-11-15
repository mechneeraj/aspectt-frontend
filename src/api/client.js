/**
 * Centralized API Client for Aspectt OTT Platform
 * Powered by Vite Environment Variable: import.meta.env.VITE_API_URL
 */

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'aspectt_token';

/**
 * Retrieves the stored JWT token from localStorage
 */
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

/**
 * Saves the JWT token to localStorage
 */
export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to update stored auth token:', err);
  }
};

/**
 * Removes the stored JWT token
 */
export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove stored auth token:', err);
  }
};

/**
 * Normalizes movie data from backend schema (posterUrl, backdropUrl, releaseYear)
 * to maintain complete compatibility with UI components expecting poster/backdrop/year
 */
export const normalizeMovie = (movie) => {
  if (!movie) return null;
  return {
    ...movie,
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    year: movie.releaseYear || movie.year,
    releaseYear: movie.releaseYear || movie.year,
    duration: movie.duration,
    director: movie.director,
    description: movie.description,
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    awardTag: movie.awardTag || null,
    directorsNote: movie.directorsNote || '',
    curatorsTake: movie.curatorsTake || '',
    poster: movie.posterUrl || movie.poster,
    posterUrl: movie.posterUrl || movie.poster,
    backdrop: movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster,
    backdropUrl: movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster,
    videoStreamUrl: movie.videoStreamUrl || movie.streamUrl || '',
    isHeroFeatured: Boolean(movie.isHeroFeatured),
    isCurated: Boolean(movie.isCurated),
  };
};

/**
 * Normalizes BehindTheLens clip objects
 */
export const normalizeClip = (clip) => {
  if (!clip) return null;
  return {
    ...clip,
    id: clip.id,
    title: clip.title,
    director: clip.filmmakerName || clip.director || 'Independent Filmmaker',
    filmmakerName: clip.filmmakerName || clip.director || 'Independent Filmmaker',
    cameraNote: clip.cameraNote || '',
    duration: clip.duration || '3m 00s',
    image: clip.thumbnailUrl || clip.image,
    thumbnailUrl: clip.thumbnailUrl || clip.image,
    clipUrl: clip.clipUrl || '',
    film: clip.film || clip.title,
  };
};

/**
 * Low-level HTTP request dispatcher with automatic Bearer token injection
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Parse JSON response body if present
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Request failed with status ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Rethrow with clear context
    throw error;
  }
}

// HTTP Verbs
export const client = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  request,
};

// ==============================================================================
// Domain-Specific API Services
// ==============================================================================

/**
 * Movies API
 */
export const moviesApi = {
  /**
   * GET /api/movies?search=...&genre=...&year=...
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.genre && params.genre !== 'All') {
      query.append('genre', params.genre);
    }
    if (params.year && params.year !== 'All') {
      query.append('year', String(params.year));
    }
    if (params.curated !== undefined && params.curated !== null) {
      query.append('curated', String(params.curated));
    }

    const qs = query.toString();
    const endpoint = qs ? `/movies?${qs}` : '/movies';
    const list = await client.get(endpoint);
    return Array.isArray(list) ? list.map(normalizeMovie) : [];
  },

  /**
   * GET /api/movies/hero
   */
  getHero: async () => {
    const list = await client.get('/movies/hero');
    return Array.isArray(list) ? list.map(normalizeMovie) : [];
  },

  /**
   * GET /api/movies/:id
   */
  getById: async (id) => {
    const movie = await client.get(`/movies/${encodeURIComponent(id)}`);
    return normalizeMovie(movie);
  },
};

/**
 * Behind The Lens API
 */
export const behindTheLensApi = {
  /**
   * GET /api/behind-the-lens
   */
  getAll: async () => {
    const list = await client.get('/behind-the-lens');
    return Array.isArray(list) ? list.map(normalizeClip) : [];
  },
};

/**
 * Film Submissions API
 */
export const submissionsApi = {
  /**
   * POST /api/submissions
   */
  create: async (submissionData) => {
    return await client.post('/submissions', submissionData);
  },

  /**
   * GET /api/submissions?status=PENDING|APPROVED|REJECTED
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') {
      query.append('status', params.status);
    }
    const qs = query.toString();
    return await client.get(qs ? `/submissions?${qs}` : '/submissions');
  },

  /**
   * GET /api/submissions/:id
   */
  getById: async (id) => {
    return await client.get(`/submissions/${encodeURIComponent(id)}`);
  },

  /**
   * PATCH /api/submissions/:id
   * Updates status ('PENDING' | 'APPROVED' | 'REJECTED') and stores review reason
   */
  updateStatus: async (id, { status, reason, reviewReason }) => {
    return await client.patch(`/submissions/${encodeURIComponent(id)}`, {
      status,
      reason,
      reviewReason,
    });
  },
};

/**
 * User & Authentication API
 */
export const authApi = {
  /**
   * POST /api/user/login or POST /api/auth/login
   */
  login: async ({ email, password }) => {
    const res = await client.post('/user/login', { email, password });
    if (res?.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  /**
   * POST /api/user/register or POST /api/auth/register
   */
  register: async ({ name, email, password, avatarUrl }) => {
    const res = await client.post('/user/register', { name, email, password, avatarUrl });
    if (res?.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  /**
   * GET /api/user/profile
   */
  getProfile: async () => {
    return await client.get('/user/profile');
  },

  /**
   * PATCH /api/user/profile
   */
  updateProfile: async (profileData) => {
    return await client.patch('/user/profile', profileData);
  },

  /**
   * GET /api/user/watchlist
   */
  getWatchlist: async () => {
    const list = await client.get('/user/watchlist');
    return Array.isArray(list) ? list.map(normalizeMovie) : [];
  },

  /**
   * POST /api/user/watchlist/:movieId
   */
  toggleWatchlist: async (movieId) => {
    return await client.post(`/user/watchlist/${encodeURIComponent(movieId)}`);
  },

  /**
   * DELETE /api/user/watchlist/:movieId
   */
  removeFromWatchlist: async (movieId) => {
    return await client.delete(`/user/watchlist/${encodeURIComponent(movieId)}`);
  },

  /**
   * Logout helper
   */
  logout: () => {
    removeStoredToken();
  },
};

export default client;

