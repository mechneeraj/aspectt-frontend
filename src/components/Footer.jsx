import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#353941] bg-[#1E2024] py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs text-[#8A8F99] tracking-wider font-medium select-none">
          Copyright © {currentYear} @aspecttmedia
        </p>
      </div>
    </footer>
  );
}

