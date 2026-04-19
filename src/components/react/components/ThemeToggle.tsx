import React from 'react';
import type { Theme } from '../types';

type BrandTheme = 'teal' | 'aubergine' | 'pine';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  brandTheme?: BrandTheme;
  onCycleBrand?: () => void;
}

// Dot colors to visually indicate the active brand palette
const brandDots: Record<BrandTheme, { a: string; b: string }> = {
  teal:      { a: '#A1E4ED', b: '#C2185B' },
  aubergine: { a: '#EDA1E4', b: '#5BC218' },
  pine:      { a: '#A1EDBB', b: '#C24018' },
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  brandTheme = 'teal',
  onCycleBrand,
}) => {
  const isDark = theme === 'dark';
  const iconColor = isDark ? 'text-brand-teal-lightAccent' : 'text-brand-teal-dark';
  const dots = brandDots[brandTheme];

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-auto flex flex-col gap-2 items-center">

      {/* Light / Dark toggle */}
      <button
        onClick={onToggle}
        className={`relative w-10 h-10 flex items-center justify-center transition-all duration-500 opacity-40 hover:opacity-100 active:scale-90 ${iconColor}`}
        aria-label="Toggle Light/Dark Theme"
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

      {/* Brand palette cycle button */}
      {onCycleBrand && (
        <button
          onClick={onCycleBrand}
          className="relative w-10 h-10 flex items-center justify-center transition-all duration-500 opacity-40 hover:opacity-100 active:scale-90 group"
          aria-label={`Switch brand palette (current: ${brandTheme})`}
          title={`Palette: ${brandTheme}`}
        >
          {/* Two dots showing the current palette's color pair */}
          <div className="flex flex-col items-center justify-center gap-[5px] transition-transform duration-500 group-hover:rotate-180">
            <span
              className="block w-3 h-3 rounded-full transition-all duration-700 shadow-sm"
              style={{ backgroundColor: dots.a }}
            />
            <span
              className="block w-3 h-3 rounded-full transition-all duration-700 shadow-sm"
              style={{ backgroundColor: dots.b }}
            />
          </div>
        </button>
      )}
    </div>
  );
};
