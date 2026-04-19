import React from 'react';
import type { Project, Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';

interface PortfolioGridMobileProps {
  projects: Project[];
  lang?: Lang;
  onSelectProject: (p: Project, rect: TransitionRect) => void;
  theme: Theme;
}

const getLocalizedTitle = (project: Project, lang: Lang): string => {
  if (lang === 'en') return project.title_en || project.title;
  if (lang === 'fr') return project.title_fr || project.title;
  if (lang === 'it') return project.title_it || project.title;
  return project.title_de || project.title;
};

export const PortfolioGridMobile: React.FC<PortfolioGridMobileProps> = ({ projects, lang = 'de', onSelectProject, theme }) => {
  const isLight = theme === 'light';
  const textClass = isLight ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = isLight ? 'text-stone-500' : 'text-stone-400';
  const bgClass = isLight ? 'bg-white shadow-sm border border-stone-100' : 'bg-[#24211f] shadow-md border border-stone-800';
  const categoryTextColor = isLight ? 'text-cyan-700' : 'text-cyan-400';

  return (
    <div className="w-full h-full overflow-y-auto overscroll-y-none pb-32 pt-28 px-4 sm:px-8">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        
        <div className="pb-2">
          <h2 className={`text-3xl font-light tracking-tight ${textClass}`}>
             {lang === 'de' ? 'Unsere Arbeiten' : 'Selected Work'}
          </h2>
          <p className={`text-sm mt-2 font-light ${subTextClass}`}>
            {lang === 'de' ? 'Entdecken Sie unsere aktuellsten Projekte.' : 'Explore our most recent projects.'}
          </p>
        </div>

        {projects.map((project) => {
          const title = getLocalizedTitle(project, lang);
          
          return (
            <div
              key={project.id}
              className={`w-full rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-transform active:scale-[0.98] ${bgClass}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onSelectProject(project, {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height
                });
              }}
            >
              {/* Image Container */}
              <div className={`relative w-full aspect-[4/3] overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
                <img
                  src={project.optimizedSrc || project.image}
                  srcSet={project.optimizedSrcSet}
                  sizes="(max-width: 1024px) 100vw"
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                
                {/* Subtle gradient overlay to premium-ize the look */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
              </div>
              
              {/* Content Area */}
              <div className="p-5 flex flex-col gap-2">
                <span className={`text-[10px] uppercase font-semibold tracking-widest ${categoryTextColor}`}>
                  {project.category}
                </span>
                
                <h3 className={`text-lg sm:text-xl font-medium tracking-tight ${textClass}`}>
                  {title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
