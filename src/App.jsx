import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Explore from './pages/Explore';
import MovieDetails from './pages/MovieDetails';
import Profile from './pages/Profile';
import BehindTheLens from './pages/BehindTheLens';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import { useWatchlist } from './context/WatchlistContext';

export default function App() {
  const { toastMessage } = useWatchlist();

  return (
    <div className="min-h-screen bg-[#1E2024] text-white flex flex-col font-sans">
      {/* Global Scroll-to-Top on Route Change */}
      <ScrollToTop />

      {/* Top Fixed/Sticky Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/behind-the-lens" element={<BehindTheLens />} />
          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global One-Line Footer for Every Page */}
      <Footer />

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Global Toast for Actions */}
      <Toast message={toastMessage} />
    </div>
  );
}
