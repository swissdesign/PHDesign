import React, { useState, useEffect } from 'react';
import type { Theme } from '../types';

interface CookieConsentProps {
  theme: Theme;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ theme }) => {
  const [stage, setStage] = useState<'hidden' | 'intro' | 'active'>('hidden');
  const [isClosing, setIsClosing] = useState(false);

  // A rough, irregular asteroid/cookie shape
  const cookiePathData = "M200,30 C260,20 320,50 360,100 C390,136 380,170 390,210 C400,250 420,280 390,330 C360,380 310,400 260,410 C210,420 160,400 110,380 C60,360 30,310 40,250 C50,190 20,140 60,90 C100,40 140,40 200,30 Z";

  useEffect(() => {
    const consent = localStorage.getItem('p-heiniger-cookie-consent');
    if (!consent) {
      triggerOpen();
    }

    const handleReopen = () => triggerOpen();
    window.addEventListener('p-heiniger-open-cookies', handleReopen);
    return () => window.removeEventListener('p-heiniger-open-cookies', handleReopen);
  }, []);

  const triggerOpen = () => {
    setIsClosing(false);
    setStage('intro');
    setTimeout(() => {
      setStage('active');
    }, 100);
  };

  const handleAction = (type: 'all' | 'essential') => {
    setIsClosing(true);
    localStorage.setItem('p-heiniger-cookie-consent', type);
    setTimeout(() => setStage('hidden'), 1500);
  };

  if (stage === 'hidden') return null;

  // Visual Constants
  const isDark = theme === 'dark';
  
  // Cookie Colors - Always brownish but varying intensity
  const cookieFillColor = isDark ? '#5D4037' : '#D7CCC8'; // Dark Brown vs Light Biscuit
  const cookieStroke = isDark ? '#8D6E63' : '#A1887F';
  
  // Text Colors - optimized for reading on brown cookie background
  const textColor = 'text-white';
  const subTextColor = 'text-orange-50'; // Warm white
  const badgeBorder = 'border-white/30 bg-black/20 text-white';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none`}>
      
      {/* 3D Container */}
      <div 
        className={`relative w-[400px] h-[400px] md:w-[600px] md:h-[600px] flex items-center justify-center perspective-1000 transition-all duration-[2000ms] cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isClosing 
            ? 'scale-[0.01] rotate-[180deg] opacity-0 blur-xl'
            : stage === 'active' 
              ? 'scale-100 rotate-0 opacity-100 blur-0' 
              : 'scale-[0.05] rotate-[720deg] opacity-0 blur-sm'
          }
        `}
      >
          {/* ROTATING GROUP */}
          <div className="relative w-full h-full animate-[spin_60s_linear_infinite] flex items-center justify-center pointer-events-auto">
             
             {/* 
                SVG LAYERS 
                We use SVG for both the texture fill and the vector outline/crumbs
             */}
             <svg 
                viewBox="0 0 440 440" 
                className="absolute w-[110%] h-[110%] z-20 overflow-visible"
                style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3))' }}
             >
                <defs>
                    {/* The Main Shape Definition */}
                    <path id="cookieShape" d={cookiePathData} />

                    {/* The Texture Filter: Generates a rough noise pattern */}
                    <filter id="cookieTexture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" in="noise" result="coloredNoise" />
                        <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
                        <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
                    </filter>
                    
                    {/* Gradient for volume */}
                    <radialGradient id="cookieGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                        <stop offset="0%" stopColor={cookieFillColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={cookieFillColor} stopOpacity="0.4" />
                    </radialGradient>
                </defs>

                {/* --- MAIN COOKIE BODY --- */}
                {/* 1. Backdrop Blur (Glass effect constrained to shape) */}
                <g>
                    {/* We need a foreignObject or just rely on CSS backdrop-filter on a div behind this.
                        Since we need strict clipping, let's keep the div approach for the blur 
                        and use this SVG for the texture/color overlay.
                    */}
                </g>

                {/* 2. Textured Fill */}
                <use 
                    href="#cookieShape" 
                    fill="url(#cookieGradient)" 
                    filter="url(#cookieTexture)"
                    stroke={cookieStroke}
                    strokeWidth="2"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                />

                {/* --- FLOATING CRUMBS (Reusing Shape) --- */}
                <g className="animate-[spin_40s_linear_infinite_reverse] origin-center">
                    {/* Crumb 1 */}
                    <g transform="translate(60, 40) rotate(20) scale(0.08)">
                        <use href="#cookieShape" fill={cookieFillColor} filter="url(#cookieTexture)" opacity="0.9" />
                    </g>
                    {/* Crumb 2 */}
                    <g transform="translate(380, 100) rotate(140) scale(0.12)">
                         <use href="#cookieShape" fill={cookieFillColor} filter="url(#cookieTexture)" opacity="0.8" />
                    </g>
                    {/* Crumb 3 */}
                    <g transform="translate(300, 380) rotate(-40) scale(0.06)">
                         <use href="#cookieShape" fill={cookieFillColor} filter="url(#cookieTexture)" opacity="0.9" />
                    </g>
                     {/* Crumb 4 */}
                     <g transform="translate(80, 350) rotate(90) scale(0.1)">
                         <use href="#cookieShape" fill={cookieFillColor} filter="url(#cookieTexture)" opacity="0.85" />
                    </g>
                </g>
             </svg>

             {/* 
                BACKDROP BLUR CONTAINER (Clipped to shape)
                This sits physically behind the SVG but we render it here to sync transforms.
                We use the same path data for clip-path.
             */}
             <div 
               className="absolute inset-0 z-10 pointer-events-none"
               style={{ 
                 clipPath: `path('${cookiePathData}')`,
                 // Centering fix for clip-path in absolute container
                 left: '50%', top: '50%', width: '440px', height: '440px', transform: 'translate(-50%, -50%)'
               }}
             >
                <div className="w-full h-full backdrop-blur-xl bg-stone-900/10" /> 
             </div>
             
             {/* TEXT CONTENT - Counter-rotated */}
             <div className="absolute inset-0 flex items-center justify-center z-30 animate-[spin_60s_linear_infinite_reverse]">
                 <div className="max-w-[260px] md:max-w-xs text-center transform transition-transform duration-1000 delay-200 drop-shadow-md">
                    
                    <span className={`inline-block mb-4 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest border backdrop-blur-md shadow-sm ${badgeBorder}`}>
                        Concept: The 2k Banner
                    </span>

                    <h2 className={`text-xl md:text-2xl font-normal leading-tight mb-4 ${textColor}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                       I designed this incase a client ever wanted to spend 2k on a cookie banner.
                    </h2>
                    
                    <p className={`text-xs font-light leading-relaxed mb-6 ${subTextColor}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                       Now I have one ready.<br/>
                       <span className="opacity-80 text-[10px]">(Yes, we use cookies to save this preference.)</span>
                    </p>

                    <div className="flex flex-col gap-3 items-center w-full px-4">
                        <button 
                            onClick={() => handleAction('all')}
                            className="w-full py-3 rounded-full text-xs uppercase tracking-widest font-bold text-stone-900 bg-white hover:bg-stone-100 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border border-white/50"
                        >
                            Worth It <span className="opacity-50 ml-1 text-[9px] font-normal">(Accept)</span>
                        </button>
                        <button 
                            onClick={() => handleAction('essential')}
                            className="w-full py-2 rounded-full text-[10px] uppercase tracking-widest hover:underline transition-colors text-white/80 hover:text-white"
                        >
                            Too Cheap (Essential)
                        </button>
                    </div>

                 </div>
             </div>
          </div>
      </div>

    </div>
  );
};
