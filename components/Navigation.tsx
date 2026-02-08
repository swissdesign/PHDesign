import React, { useState, useRef, useEffect } from 'react';
import { Project, Theme, TransitionRect } from '../types';
import { MenuModal } from './MenuModal';

interface NavigationProps {
  currentView: 'work' | 'services';
  onNavigate: (view: 'work' | 'services') => void;
  onOpenContact: (rect: TransitionRect) => void;
  onSelectProject: (project: Project, rect: TransitionRect) => void;
  isAnyModalOpen: boolean;
  theme: Theme;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, onOpenContact, onSelectProject, isAnyModalOpen, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOriginRect, setMenuOriginRect] = useState<TransitionRect | null>(null);
  const [isMenuTransitioning, setIsMenuTransitioning] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const MENU_CLOSE_DELAY = 720; // aligns with MenuModal close animation (700ms) with slight buffer

  const handleMenuClick = () => {
    if (isMenuTransitioning) return;
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuOriginRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setIsMenuOpen(true);
    }
  };

  // Detect coarse pointers (mobile/tablet) to hide burger when modals are open
  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)');
    const handleChange = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    setIsCoarsePointer(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handleChange);
    } else {
      // @ts-ignore Safari
      mql.addListener(handleChange);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore Safari
        mql.removeListener(handleChange);
      }
    };
  }, []);

  const handleMenuClose = () => {
    if (isMenuTransitioning) return;
    setIsMenuOpen(false);
    setIsMenuTransitioning(true);
    setTimeout(() => setIsMenuTransitioning(false), MENU_CLOSE_DELAY);
  };

  const handleMenuProjectSelect = (project: Project, rect: TransitionRect) => {
    if (isMenuTransitioning) return; // lock to avoid race/double open
    setIsMenuTransitioning(true);
    setIsMenuOpen(false);
    setTimeout(() => {
      onNavigate('work');
      onSelectProject(project, rect);
      setIsMenuTransitioning(false);
    }, MENU_CLOSE_DELAY);
  };

  // Format date: "Samstag, 07. Februar 2025"
  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Colors
  const textColor = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextColor = theme === 'light' ? 'text-cyan-900' : 'text-cyan-200';
  
  // Menu Icon Lines - asymmetric coloring
  const line1Color = theme === 'light' ? 'bg-stone-900' : 'bg-stone-100';
  // The second line is now distinctly blue (cyan-700/400) to act as a "random" accent
  const line2Color = theme === 'light' 
    ? 'bg-cyan-700 group-hover:bg-cyan-500' 
    : 'bg-cyan-400 group-hover:bg-cyan-200';

  // Cinematic Gradient
  const gradientClass = theme === 'light' 
    ? 'from-[#FAFAF9]/90 via-[#FAFAF9]/40 to-transparent' 
    : 'from-[#1C1917]/90 via-[#1C1917]/40 to-transparent';

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        
        {/* Readability Shield */}
        <div 
            className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b ${gradientClass} backdrop-blur-[3px] transition-all duration-700 pointer-events-none`} 
            style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0) 100%)'
            }}
        />

        {/* Content Container */}
        <div className="relative w-full px-6 py-6 flex justify-between items-start">
          
          {/* Brand Name */}
          <div className="pointer-events-auto">
            <h1 
              className={`text-sm font-semibold tracking-tight uppercase cursor-pointer transition-colors duration-500 group ${textColor}`}
              onClick={() => onNavigate('work')}
            >
              P. Heiniger
              {/* The subtitle is now subtly colored */}
              <span className={`block font-normal text-xs mt-1 transition-colors duration-500 opacity-80 ${subTextColor}`}>
                Design Studio
              </span>
            </h1>
          </div>

          {/* Minimalist Menu Trigger */}
          <div className="pointer-events-auto">
            <button
              ref={menuButtonRef}
              onClick={handleMenuClick}
              className={`group relative w-12 h-12 flex items-center justify-center focus:outline-none transition-all duration-300 active:scale-90 ${
                (isMenuOpen || (isAnyModalOpen && isCoarsePointer)) ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Menu"
            >
              {/* Asymmetric Two-Line Icon */}
              <div className="flex flex-col items-center justify-center gap-[6px] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:gap-[8px] group-hover:rotate-90">
                <span className={`block w-6 h-[1.5px] transition-colors duration-500 ${line1Color}`} />
                <span className={`block w-6 h-[1.5px] transition-colors duration-500 ${line2Color}`} />
              </div>
            </button>
          </div>
          
          {/* Status Indicator */}
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 hidden md:block transition-colors duration-500 opacity-70 pointer-events-none ${textColor}`}>
            <span className="text-[10px] tracking-widest uppercase font-medium">Andermatt — {formattedDate}</span>
          </div>
        </div>
      </nav>

      {/* Menu Modal Overlay */}
      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={handleMenuClose} 
        onNavigate={onNavigate}
        onOpenContact={onOpenContact}
        onSelectProject={handleMenuProjectSelect}
        originRect={menuOriginRect}
        theme={theme}
      />
    </>
  );
};
