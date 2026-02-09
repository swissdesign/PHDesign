import React, { useState, useEffect } from 'react';
import type { Service, Theme, TransitionRect } from '../types';
import { QuoteForm } from './QuoteForm';

interface ServiceDetailProps {
  service: Service;
  originRect: TransitionRect;
  onClose: () => void;
  theme: Theme;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, originRect, onClose, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mode, setMode] = useState<'info' | 'booking'>('info');

  // Detect mobile for robust fullscreen sizing
  const [isMobile, setIsMobile] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Animation sequence
    const t1 = setTimeout(() => setIsExpanded(true), 20);
    const t2 = setTimeout(() => setShowContent(true), 400);
    // Pointer coarse detection for tablets/phones
    const mql = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    setIsCoarsePointer(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handlePointerChange);
    } else {
      // @ts-ignore Safari
      mql.addListener(handlePointerChange);
    }

    return () => { 
        clearTimeout(t1); 
        clearTimeout(t2); 
        window.removeEventListener('resize', handleResize);
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handlePointerChange);
        } else {
          // @ts-ignore Safari
          mql.removeListener(handlePointerChange);
        }
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setShowContent(false);
    setIsExpanded(false);
    setTimeout(onClose, 700);
  };

  const bgClass = theme === 'light' ? 'bg-white' : 'bg-[#1C1917]';
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-500' : 'text-stone-400';
  
  // Accents
  const activeTabClass = theme === 'light' ? 'border-cyan-900 text-cyan-900' : 'border-cyan-200 text-cyan-200';
  const bulletDotClass = theme === 'light' ? 'bg-cyan-800' : 'bg-cyan-200';
  const buttonClass = theme === 'light' ? 'bg-stone-900 text-white hover:bg-cyan-900' : 'bg-white text-stone-900 hover:bg-cyan-200';

  // Dynamic Style for Expansion
  // Mobile: Full screen (inset 0), no radius. Desktop: Centered, rounded.
  const expandedStyle = isMobile ? {
      top: 0,
      left: 0,
      width: '100%',
      height: '100dvh', // Use dvh for robust mobile height
      transform: 'none',
      borderRadius: '0px'
  } : {
      top: '10%',
      left: '50%',
      width: 'min(90%, 800px)',
      height: 'min(80%, 700px)',
      transform: 'translateX(-50%)',
      borderRadius: '24px'
  };

  const initialStyle = {
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transform: 'none',
      borderRadius: '0px'
  };

  const needsTopSpacing = isCoarsePointer || isMobile;
  // Headroom on touch devices so the close button sits away from nav/burger
  const topPaddingStyle = needsTopSpacing 
    ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 96px)' } 
    : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-700 ease-in-out ${
          isExpanded && !isClosing ? 'opacity-100' : 'opacity-0'
        } ${theme === 'light' ? 'bg-[#FAFAF9]/80' : 'bg-black/80'}`}
        onClick={handleClose}
      />

      {/* Card */}
      <div 
        className={`fixed md:relative shadow-2xl overflow-hidden transition-all duration-700 cubic-bezier(0.76, 0, 0.24, 1) ${bgClass}`}
        style={isExpanded ? expandedStyle : initialStyle}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className={`absolute md:top-6 md:right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ${
            theme === 'light' ? 'bg-stone-100 hover:bg-stone-200 text-stone-900' : 'bg-stone-800 hover:bg-stone-700 text-stone-100'
          } ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          style={needsTopSpacing ? { top: 'calc(env(safe-area-inset-top, 0px) + 18px)', right: '18px', position: 'fixed' } : undefined}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Content Container */}
        <div 
          className={`w-full h-full flex flex-col md:flex-row transition-opacity duration-500 delay-100 ${showContent ? 'opacity-100' : 'opacity-0'}`}
          style={topPaddingStyle}
        >
          
          {/* Left Side: Service Icon & Title (Visual Header) */}
          {/* Compact padding on mobile to save vertical space for form */}
          <div className={`w-full md:w-1/3 p-6 md:p-12 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-between shrink-0 ${theme === 'light' ? 'bg-stone-50' : 'bg-stone-800/50'}`}>
            <div className="flex items-center md:block gap-4">
                <div className="w-12 h-12 md:w-24 md:h-24 md:mb-6 shrink-0">
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className={`w-full h-full ${textClass}`}
                    >
                        <path d={service.icon} />
                    </svg>
                </div>
                <div>
                    <span className={`text-[10px] uppercase tracking-widest block mb-1 md:mb-2 opacity-50 ${textClass}`}>Service Details</span>
                    <h2 className={`text-2xl md:text-4xl font-light leading-tight ${textClass}`}>{service.name}</h2>
                </div>
            </div>
            
            <div className={`hidden md:block mt-6 pt-6 border-t w-full ${theme === 'light' ? 'border-stone-200' : 'border-stone-700'}`}>
                <span className={`block text-xs uppercase tracking-wider mb-1 ${subTextClass}`}>Investment</span>
                <span className={`text-lg font-medium ${textClass}`}>{service.startPrice}</span>
            </div>
          </div>

          {/* Right Side: Toggleable Content (Info or Booking) */}
          {/* Use flex-1 and h-full to ensure QuoteForm can expand */}
          <div className="w-full md:w-2/3 p-6 md:p-12 flex flex-col relative overflow-hidden flex-1">
            
            {/* Mode Switcher */}
            <div className="flex gap-6 mb-4 md:mb-8 border-b border-stone-200 dark:border-stone-800 pb-2 md:pb-4 shrink-0">
              <button 
                onClick={() => setMode('info')}
                className={`text-xs uppercase tracking-widest pb-2 md:pb-4 -mb-2 md:-mb-4 border-b-2 transition-colors ${
                  mode === 'info' 
                    ? activeTabClass 
                    : 'border-transparent text-stone-400 hover:text-stone-500'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setMode('booking')}
                className={`text-xs uppercase tracking-widest pb-2 md:pb-4 -mb-2 md:-mb-4 border-b-2 transition-colors ${
                  mode === 'booking' 
                    ? activeTabClass 
                    : 'border-transparent text-stone-400 hover:text-stone-500'
                }`}
              >
                Booking Request
              </button>
            </div>

            {/* Info View */}
            <div className={`absolute inset-x-6 md:inset-x-12 top-24 md:top-32 bottom-6 md:bottom-8 transition-all duration-500 overflow-y-auto ${mode === 'info' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-10 opacity-0 z-0 pointer-events-none'}`}>
              <div className={`md:hidden mb-6 pb-6 border-b ${theme === 'light' ? 'border-stone-100' : 'border-stone-800'}`}>
                 <span className={`block text-xs uppercase tracking-wider mb-1 ${subTextClass}`}>Investment</span>
                 <span className={`text-lg font-medium ${textClass}`}>{service.startPrice}</span>
              </div>

              <h3 className={`text-lg font-medium mb-6 ${textClass}`}>What's included</h3>
              <ul className="space-y-4 mb-8">
                {service.bullets.map((bullet, i) => (
                  <li key={i} className={`flex items-start gap-3 ${subTextClass}`}>
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${bulletDotClass}`} />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                 <button 
                   onClick={() => setMode('booking')}
                   className={`w-full md:w-auto px-6 py-4 md:py-3 rounded-full text-xs uppercase tracking-widest transition-transform hover:scale-105 shadow-lg ${buttonClass}`}
                 >
                   Start Project
                 </button>
              </div>
            </div>

            {/* Booking View */}
            {/* Absolute positioning with flex layout inside ensures full height usage */}
            <div className={`absolute inset-x-6 md:inset-x-12 top-24 md:top-32 bottom-6 md:bottom-8 transition-all duration-500 ${mode === 'booking' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-10 opacity-0 z-0 pointer-events-none'}`}>
               <QuoteForm theme={theme} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
