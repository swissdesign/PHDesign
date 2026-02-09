import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';
import { pickLang, pickLangArray } from '../utils/pickLang';
import { ServiceDetail } from './ServiceDetail';

// Detect coarse (touch-first) pointers so we can disable hover and favor swipe/scroll
const useCoarsePointer = () => {
  const [isCoarse, setIsCoarse] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia('(pointer: coarse)');
    const listener = (event: MediaQueryListEvent) => setIsCoarse(event.matches);
    // Older Safari only supports addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', listener);
    } else {
      // @ts-ignore
      mql.addListener(listener);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
      } else {
        // @ts-ignore
        mql.removeListener(listener);
      }
    };
  }, []);

  return isCoarse;
};

interface ServicesWheelProps {
  services: any[];
  categories?: any[];
  lang?: Lang;
  theme: Theme;
  onModalToggle?: (open: boolean) => void;
}

type LocalService = {
  id: string;
  name: string;
  teaser: string;
  icon: string;
  bullets: string[];
  startPrice: string;
  description: string;
  categoryLabel: string;
  raw: Record<string, unknown>;
};

const DEFAULT_ICON = 'M12 2v20M2 12h20';

export const ServicesWheel: React.FC<ServicesWheelProps> = ({ services, categories, lang = 'de', theme, onModalToggle }) => {
  // Single source of truth for which service is active
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<LocalService | null>(null);
  const [originRect, setOriginRect] = useState<TransitionRect | null>(null);
  const isCoarsePointer = useCoarsePointer();
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    (categories ?? []).forEach((category, idx) => {
      const row = (category ?? {}) as Record<string, unknown>;
      const name = pickLang(row, 'name', lang) || String(row.name ?? '').trim();
      const id = String(row.id ?? row.slug ?? `category-${idx}`);
      if (id) map.set(id, name);
      if (typeof row.slug === 'string' && row.slug.trim()) map.set(row.slug, name);
    });
    return map;
  }, [categories, lang]);

  const normalizedServices = useMemo<LocalService[]>(() => {
    return (services ?? []).map((service, idx) => {
      const row = (service ?? {}) as Record<string, unknown>;
      const id = String(row.id ?? row.slug ?? row.service_id ?? `service-${idx}`);
      const name = pickLang(row, 'title', lang) || pickLang(row, 'name', lang) || String(row.name ?? row.title ?? `Service ${idx + 1}`);
      const description = pickLang(row, 'description', lang);
      const teaser = pickLang(row, 'teaser', lang) || description;
      const bullets =
        pickLangArray(row, 'bullets', lang).length > 0
          ? pickLangArray(row, 'bullets', lang)
          : pickLangArray(row, 'features', lang).length > 0
            ? pickLangArray(row, 'features', lang)
            : pickLangArray(row, 'includes', lang);
      const startPrice =
        pickLang(row, 'startPrice', lang) ||
        pickLang(row, 'start_price', lang) ||
        pickLang(row, 'price', lang) ||
        String(row.startPrice ?? row.start_price ?? row.price ?? '').trim();
      const icon = String(row.icon ?? '').trim() || DEFAULT_ICON;
      const categoryId = String(row.category_id ?? row.categoryId ?? row.category ?? '').trim();
      const categoryLabel = categoryId ? categoryNameById.get(categoryId) || categoryId : '';

      return {
        id,
        name,
        teaser,
        icon,
        bullets,
        startPrice,
        description,
        categoryLabel,
        raw: row,
      };
    });
  }, [services, lang, categoryNameById]);

  useEffect(() => {
    setActiveServiceIndex((prev) => {
      if (normalizedServices.length === 0) return 0;
      return Math.min(prev, normalizedServices.length - 1);
    });
  }, [normalizedServices.length]);

  const activeId = normalizedServices[activeServiceIndex]?.id ?? normalizedServices[0]?.id ?? '';
  
  const total = normalizedServices.length;
  
  // Angle per item
  const anglePerSlice = total > 0 ? 360 / total : 0;

  // We want the active item to be at 180deg (Left side of wheel, facing the text).
  const rotation = 180 - (activeServiceIndex * anglePerSlice);

  // Navigation helpers ----------------------------------------------------
  const lastNavigationTs = useRef(0);
  const NAV_COOLDOWN_MS = 320; // small debounce so a single swipe/scroll doesn't skip items

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(total - 1, index)),
    [total]
  );

  const stepActive = useCallback(
    (direction: 1 | -1) => {
      const now = Date.now();
      if (now - lastNavigationTs.current < NAV_COOLDOWN_MS) return;
      lastNavigationTs.current = now;
      setActiveServiceIndex(prev => clampIndex(prev + direction));
    },
    [clampIndex]
  );

  // Wheel/trackpad scroll (desktop + trackpads)
  const handleWheel = (e: React.WheelEvent) => {
    // Ignore tiny jitters from precision wheels
    if (Math.abs(e.deltaY) < 2) return;
    const direction: 1 | -1 = e.deltaY > 0 ? 1 : -1;
    stepActive(direction);
  };

  // Touch swipe (phones/tablets)
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCoarsePointer) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isCoarsePointer || touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    const SWIPE_THRESHOLD = 35; // tuned to avoid accidental slight moves
    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
    // Swipe up (negative delta) moves forward; swipe down moves backward
    stepActive(deltaY > 0 ? -1 : 1);
  };

  const handleSelect = (service: LocalService, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOriginRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setSelectedService(service);
    onModalToggle?.(true);
  };

  const closeDetail = () => {
    setSelectedService(null);
    onModalToggle?.(false);
  };

  // Styles
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-400' : 'text-stone-600';
  const circleBorder = theme === 'light' ? 'border-stone-200' : 'border-stone-800';

  // Accents - enhanced
  const activeNumberClass = theme === 'light' ? 'text-cyan-600' : 'text-cyan-400';
  const activeIconClass = theme === 'light' ? 'text-cyan-800' : 'text-cyan-200';
  const activeLineClass = 'bg-gradient-to-r from-cyan-500 to-transparent'; 

  // Teaser visibility rules
  const teaserShouldShow = (index: number) => {
    if (isCoarsePointer) return index === activeServiceIndex; // mobile/tablet shows active only
    return index === activeServiceIndex; // desktop: hover sets activeServiceIndex already
  };

  return (
    <div 
      className="w-full h-full flex flex-col md:flex-row items-center justify-center relative overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* LEFT SIDE: The List */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-6 md:px-8 md:pl-20 z-30 relative pointer-events-none">
         <div className="space-y-4 md:space-y-6 max-w-lg pointer-events-auto">
            {normalizedServices.map((service, i) => (
              <div 
                key={service.id || `service-list-${i}`}
                className="group relative cursor-pointer py-2 md:py-0"
                // Hover only on precise pointers to avoid fake hover on touch
                onMouseEnter={!isCoarsePointer ? () => setActiveServiceIndex(i) : undefined}
                onClick={(e) => { setActiveServiceIndex(i); handleSelect(service, e); }}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <span className={`text-xs font-mono transition-colors duration-300 ${activeId === service.id ? activeNumberClass : 'text-stone-300 opacity-20'}`}>
                    0{i + 1}
                  </span>
                  <h2 
                    className={`font-light tracking-tight transition-all duration-700 origin-left
                      ${activeId === service.id 
                        ? `text-3xl md:text-5xl ${textClass} scale-100 translate-x-2 md:translate-x-0` 
                        : `text-xl md:text-3xl ${subTextClass} hover:text-stone-500 scale-95`
                      }
                    `}
                  >
                    {service.name}
                  </h2>
                </div>
                {/* Teaser: reserved space with subtle reveal to avoid layout shift */}
                <div className="pl-8 md:pl-[3.9rem] h-5 md:h-6 overflow-hidden">
                  <span
                    className={`block text-[11px] md:text-xs leading-tight text-cyan-600/90 transition-all duration-300 ease-out
                      ${teaserShouldShow(i) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
                    `}
                  >
                    {service.teaser || service.categoryLabel}
                  </span>
                </div>
                {/* Mobile-only visible details hint */}
                <div className={`md:hidden pl-8 mt-1 overflow-hidden transition-all duration-300 ${activeId === service.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                   <span className="text-[10px] uppercase tracking-widest text-cyan-600 font-medium flex items-center gap-2">
                      Tap for details <span className="text-lg leading-none">&rarr;</span>
                   </span>
                </div>
              </div>
            ))}
         </div>
      </div>

      {/* RIGHT SIDE: The Orbit Visual */}
      {/* Restored to previous positioning and size to maintain the wheel effect and overlap */}
      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-700
          right-[-25%] w-[60vh] h-[60vh] 
          md:right-[-15%] md:w-[70vh] md:h-[70vh]
      `}>
         
         {/* Static Rings */}
         <div className={`absolute inset-0 rounded-full border ${circleBorder} opacity-30`} />
         <div className={`absolute inset-[25%] rounded-full border border-dashed ${circleBorder} opacity-20`} />
         <div className={`absolute inset-[40%] rounded-full border ${circleBorder} opacity-10`} />
         
         {/* Rotating Container */}
         <div 
            className="absolute inset-0 rounded-full transition-transform duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `rotate(${rotation}deg)` }}
         >
            {normalizedServices.map((service, i) => {
               const angle = i * anglePerSlice;
               return (
                 <div
                   key={service.id || `service-orbit-${i}`}
                   className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center"
                   // Restored translate(35vh) to push icons out for the "in front" effect
                   style={{ transform: `rotate(${angle}deg) translate(35vh) rotate(-${angle}deg)` }} 
                 >
                    <div 
                      className="relative flex items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{ 
                        transform: `rotate(${-rotation}deg) scale(${activeId === service.id ? 1.2 : 0.8})`,
                        opacity: activeId === service.id ? 1 : 0.15 
                      }}
                    >
                       {/* SVG Icon */}
                       <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center`}>
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="0.8" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={`w-full h-full transition-colors duration-500 ${activeId === service.id ? activeIconClass : textClass}`}
                          >
                             <path d={service.icon} />
                          </svg>
                       </div>
                       
                       {/* Connection Line to Center */}
                       {activeId === service.id && (
                         <div className={`absolute right-[120%] top-1/2 w-[10vh] md:w-[15vh] h-[1.5px] ${activeLineClass} origin-right animate-in fade-in zoom-in duration-1000 rounded-full`} />
                       )}
                    </div>
                 </div>
               );
            })}
         </div>

         {/* Center Point */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] bg-cyan-500`} />
      </div>

      {/* Detail Modal */}
      {selectedService && originRect && (
        <ServiceDetail 
          service={selectedService}
          originRect={originRect}
          onClose={closeDetail}
          lang={lang}
          theme={theme}
        />
      )}
    </div>
  );
};
