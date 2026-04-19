import React, { useMemo, useState } from 'react';
import type { Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';
import { pickLang, pickLangArray } from '../utils/pickLang';
import { ServiceDetail } from './ServiceDetail';

interface ServicesTilesProps {
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

export const ServicesTiles: React.FC<ServicesTilesProps> = ({ services, categories, lang = 'de', theme, onModalToggle }) => {
  const [selectedService, setSelectedService] = useState<LocalService | null>(null);
  const [originRect, setOriginRect] = useState<TransitionRect | null>(null);

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

  const isLight = theme === 'light';
  const textClass = isLight ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = isLight ? 'text-stone-500' : 'text-stone-400';
  const cardBg = isLight ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-stone-100' : 'bg-[#24211f] shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-stone-800';
  const iconClass = isLight ? 'text-cyan-700' : 'text-cyan-400';
  const badgeBg = isLight ? 'bg-stone-100 text-stone-600' : 'bg-stone-800 text-stone-300';
  const priceColor = isLight ? 'text-cyan-800' : 'text-cyan-300';

  return (
    <div className="w-full h-full overflow-y-auto overscroll-y-none pb-32 pt-28 px-4 sm:px-8">
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        {/* Header space could go here if needed, but App.tsx handles global header */}
        <div className="pb-4">
          <h2 className={`text-3xl font-light tracking-tight ${textClass}`}>
             {lang === 'de' ? 'Unsere Leistungen' : 'Our Services'}
          </h2>
          <p className={`text-sm mt-2 font-light ${subTextClass}`}>
            {lang === 'de' ? 'Was wir für Sie tun können.' : 'What we can do for you.'}
          </p>
        </div>

        {normalizedServices.map((service) => (
          <div
            key={service.id}
            onClick={(e) => handleSelect(service, e)}
            className={`w-full rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-transform active:scale-[0.98] ${cardBg}`}
          >
            <div className="flex justify-between items-start">
               <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-cyan-50' : 'bg-cyan-950/30'} flex items-center justify-center shrink-0`}>
                 <svg 
                   viewBox="0 0 24 24" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="1.2" 
                   strokeLinecap="round" 
                   strokeLinejoin="round"
                   className={`w-6 h-6 ${iconClass}`}
                 >
                    <path d={service.icon} />
                 </svg>
               </div>
               
               {service.categoryLabel && (
                 <span className={`text-[10px] uppercase font-semibold tracking-widest px-2.5 py-1 rounded-md ${badgeBg}`}>
                    {service.categoryLabel}
                 </span>
               )}
            </div>

            <div>
              <h3 className={`text-xl font-medium tracking-tight mb-2 ${textClass}`}>
                {service.name}
              </h3>
              <p className={`text-sm leading-relaxed font-light line-clamp-2 ${subTextClass}`}>
                {service.teaser}
              </p>
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-800/60 transition-colors">
              <span className={`text-[11px] uppercase tracking-widest font-semibold ${isLight ? 'text-stone-400' : 'text-stone-500'}`}>
                {lang === 'de' ? 'Details ansehen' : 'View Details'} &rarr;
              </span>
              
              {service.startPrice && (
                 <span className={`text-sm font-medium ${priceColor}`}>
                   {service.startPrice}
                 </span>
              )}
            </div>
          </div>
        ))}
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
