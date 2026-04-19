import React, { useState } from 'react';
import type { Lang } from '../../../lib/i18n';
import { ServiceDetail } from './ServiceDetail';

import type { Theme, TransitionRect, Service, Category } from '../types';

interface ServicesTilesProps {
  services: Service[];
  categories?: Category[];
  lang?: Lang;
  theme: Theme;
  onModalToggle?: (open: boolean) => void;
}

const DEFAULT_ICON = 'M12 2v20M2 12h20';

export const ServicesTiles: React.FC<ServicesTilesProps> = ({ services, categories, lang = 'de', theme, onModalToggle }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [originRect, setOriginRect] = useState<TransitionRect | null>(null);

  const handleSelect = (service: Service, e: React.MouseEvent) => {
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

  const isLight = theme === 'light';
  const textClass = isLight ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = isLight ? 'text-stone-500' : 'text-stone-400';
  const cardBg = isLight ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-stone-100' : 'bg-[#24211f] shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-stone-800';
  const iconClass = isLight ? 'text-cyan-700' : 'text-cyan-400';
  const badgeBg = isLight ? 'bg-stone-100 text-stone-600' : 'bg-stone-800 text-stone-300';
  const priceColor = isLight ? 'text-cyan-800' : 'text-cyan-300';

  return (
    <div className="w-full h-full overflow-y-auto overscroll-y-none pb-32 pt-28 px-4 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header space */}
        <div className="pb-8 text-center md:text-left">
          <h2 className={`text-3xl md:text-5xl font-light tracking-tight ${textClass}`}>
             {lang === 'de' ? 'Unsere Leistungen' : 'Our Services'}
          </h2>
          <p className={`text-sm md:text-lg mt-3 md:mt-4 font-light ${subTextClass}`}>
            {lang === 'de' ? 'Was wir für Sie tun können.' : 'What we can do for you.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={(e) => handleSelect(service, e)}
            className={`w-full rounded-2xl p-6 md:p-8 flex flex-col gap-4 cursor-pointer transition-transform hover:-translate-y-1 active:scale-[0.98] ${cardBg}`}
          >
            <div className="flex justify-between items-start">
               <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${isLight ? 'bg-cyan-50' : 'bg-cyan-950/30'} flex items-center justify-center shrink-0`}>
                 <svg 
                   viewBox="0 0 24 24" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="1.2" 
                   strokeLinecap="round" 
                   strokeLinejoin="round"
                   className={`w-6 h-6 md:w-8 md:h-8 ${iconClass}`}
                 >
                    <path d={service.icon} />
                 </svg>
               </div>
               
               {service.categoryLabel && (
                 <span className={`text-[10px] md:text-xs uppercase font-semibold tracking-widest px-2.5 md:px-3 py-1 md:py-1.5 rounded-md ${badgeBg}`}>
                    {service.categoryLabel}
                 </span>
               )}
            </div>

            <div className="mt-2 md:mt-4">
              <h3 className={`text-xl md:text-3xl font-medium tracking-tight mb-2 md:mb-4 ${textClass}`}>
                {service.name}
              </h3>
              <p className={`text-sm md:text-base leading-relaxed font-light line-clamp-3 md:line-clamp-4 ${subTextClass}`}>
                {service.teaser}
              </p>
            </div>

            <div className="mt-auto pt-4 md:pt-6 flex items-center justify-between border-t border-stone-200 dark:border-stone-800/60 transition-colors">
              <span className={`text-[11px] md:text-xs uppercase tracking-widest font-semibold ${isLight ? 'text-stone-400' : 'text-stone-500'}`}>
                {lang === 'de' ? 'Details ansehen' : 'View Details'} &rarr;
              </span>
              
              {service.startPrice && (
                 <span className={`text-sm md:text-base font-medium ${priceColor}`}>
                   {service.startPrice}
                 </span>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

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
