import React from 'react';

/**
 * Clean Deep Ash Gray Matte (#282B30) Loading Skeletons
 * Preserves exact Aspectt layout with soft shimmer pulse
 */

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col select-none animate-pulse">
      {/* Thumbnail */}
      <div className="relative aspect-poster sm:aspect-video w-full bg-[#282B30] border border-[#353941] rounded-lg sm:rounded-xl overflow-hidden" />
      {/* Title */}
      <div className="pt-2 px-0.5 space-y-1">
        <div className="h-3 bg-[#282B30] rounded w-3/4 border border-[#353941]/50" />
      </div>
    </div>
  );
}

export function HeroSliderSkeleton() {
  return (
    <div className="w-full bg-[#282B30] border border-[#353941] rounded-xl sm:rounded-2xl p-6 sm:p-8 min-h-[350px] md:h-[420px] lg:h-[450px] animate-pulse flex flex-col justify-end relative overflow-hidden">
      <div className="flex gap-2.5 z-10 p-1.5 rounded-xl bg-black/40 border border-white/5 w-fit">
        <div className="h-10 w-24 bg-[#7C3AED]/40 rounded-lg" />
        <div className="h-10 w-24 bg-[#18181B] border border-white/10 rounded-lg" />
      </div>
    </div>
  );
}

export function FootageCardSkeleton() {
  return (
    <div className="bg-[#282B30] border border-[#353941] rounded-xl p-3 animate-pulse space-y-2">
      <div className="aspect-video w-full bg-[#1E2024] rounded-lg border border-[#353941]" />
      <div className="h-3 bg-[#1E2024] rounded w-2/3" />
      <div className="h-2.5 bg-[#1E2024] rounded w-1/2" />
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="bg-[#282B30] border border-[#353941] rounded-xl sm:rounded-2xl p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Poster Skeleton */}
          <div className="md:col-span-5 lg:col-span-4 flex justify-center">
            <div className="w-full max-w-xs aspect-poster bg-[#1E2024] border border-[#353941] rounded-xl sm:rounded-2xl" />
          </div>

          {/* Right Details Skeleton */}
          <div className="md:col-span-7 lg:col-span-8 space-y-5">
            <div className="h-8 sm:h-12 bg-[#1E2024] border border-[#353941] rounded w-3/4" />
            <div className="h-4 bg-[#1E2024] border border-[#353941] rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-[#1E2024] border border-[#353941] rounded" />
              <div className="h-6 w-20 bg-[#1E2024] border border-[#353941] rounded" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-10 w-24 bg-[#7E57C2]/40 rounded" />
              <div className="h-10 w-28 bg-[#1E2024] border border-[#353941] rounded" />
            </div>
            <div className="space-y-2 pt-4 border-t border-[#353941]">
              <div className="h-3.5 bg-[#1E2024] rounded w-full" />
              <div className="h-3.5 bg-[#1E2024] rounded w-full" />
              <div className="h-3.5 bg-[#1E2024] rounded w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

