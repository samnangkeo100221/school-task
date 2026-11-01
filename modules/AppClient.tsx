'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const DynamicApp = dynamic(() => import('./App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 warm:bg-[#f7f3e9] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 warm:bg-[#b45309] flex items-center justify-center text-white shadow-sm mb-3">
        <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f]">MY SCHOOL TASK SYSTEM</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#786f60] mt-1 font-medium">កំពុងដំណើរការប្រព័ន្ធគ្រប់គ្រងការងារសាលារៀន...</p>
    </div>
  ),
});

export default function AppClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 warm:bg-[#f7f3e9] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 warm:bg-[#b45309] flex items-center justify-center text-white shadow-sm mb-3">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f]">MY SCHOOL TASK SYSTEM</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#786f60] mt-1 font-medium">កំពុងដំណើរការប្រព័ន្ធគ្រប់គ្រងការងារសាលារៀន...</p>
      </div>
    );
  }

  return <DynamicApp />;
}
