import React from 'react';
import type { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-auto">
      <button 
        onClick={onToggle}
        className={`relative w-10 h-10 flex items-center justify-center transition-all duration-500 opacity-40 hover:opacity-100 active:scale-90 ${
          isDark ? 'text-white' : 'text-stone-900'
        }`}
        aria-label="Toggle Theme"
      >
        <div className="relative w-full h-full">
            {/* Sun Icon */}
            <svg 
                className={`absolute inset-0 w-full h-full p-2 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>

            {/* Moon Icon */}
            <svg 
                className={`absolute inset-0 w-full h-full p-2 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        </div>
      </button>
    </div>
  );
};
