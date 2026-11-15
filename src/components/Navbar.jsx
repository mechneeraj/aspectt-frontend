import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import AspectLogo from './AspectLogo';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const { userAvatar } = useWatchlist();

  const displayAvatar = user?.avatarUrl || userAvatar;
  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Profile';

  return (
    <header className="sticky top-0 z-[100] w-full bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Section: Custom Sharp Flat-Matte Wordmark Logo for "ASPECTT" (Non-clickable, no reload, no navigation) */}
        <div
          className="flex items-center select-none cursor-default"
          onClick={(e) => {
            e.preventDefault();
            // Explicit requirement: Clicking on "ASPECTT" must do nothing
          }}
          title="Aspectt"
        >
          <AspectLogo className="h-6 sm:h-7 w-auto" />
        </div>

        {/* Center Section: Navigation Links (Home and Explore with active bottom underline) */}
        <nav className="flex items-center gap-6 sm:gap-10 h-full">
          {/* Home Link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `
              relative flex items-center h-full text-sm font-semibold tracking-wide transition-colors
              ${isActive ? 'text-white' : 'text-[#B8BCC4] hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className="drop-shadow-sm">Home</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#7E57C2]" />
                )}
              </>
            )}
          </NavLink>

          {/* Explore Link */}
          <NavLink
            to="/explore"
            className={({ isActive }) => `
              relative flex items-center h-full text-sm font-semibold tracking-wide transition-colors
              ${isActive ? 'text-white' : 'text-[#B8BCC4] hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <span className="drop-shadow-sm">Explore</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#7E57C2]" />
                )}
              </>
            )}
          </NavLink>
        </nav>

        {/* Right Section: Profile Button */}
        <div className="flex items-center">
          {isAuthenticated && user ? (
            /* When Logged In: Direct navigation to /profile (No dropdown menu) */
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer border border-transparent hover:border-[#353941]"
              title={`Profile - Signed in as ${user.name}`}
            >
              <Avatar
                src={displayAvatar}
                alt={user.name || 'User'}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#7E57C2',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  border: '1.5px solid #353941',
                }}
              >
                {initialLetter}
              </Avatar>
              <span className="text-sm font-medium text-white group-hover:text-[#7E57C2] transition-colors hidden sm:inline drop-shadow-sm max-w-[120px] truncate">
                {firstName}
              </span>
            </Link>
          ) : (
            /* When Logged Out: Auth Dropdown / Modal Trigger */
            <ProfileDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
