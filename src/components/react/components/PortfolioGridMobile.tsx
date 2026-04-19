import React from 'react';
import type { Project, Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';

interface PortfolioGridMobileProps {
  projects: Project[];
  lang?: Lang;
  onSelectProject: (p: Project, rect: TransitionRect) => void;
  theme: Theme;
}


export const PortfolioGridMobile: React.FC<PortfolioGridMobileProps> = ({ projects, lang = 'de', onSelectProject, theme }) => {
  const isLight = theme === 'light';
  const textClass = isLight ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = isLight ? 'text-stone-500' : 'text-stone-400';
  const bgClass = isLight ? 'bg-white shadow-sm border border-stone-100' : 'bg-[#24211f] shadow-md border border-stone-800';
  const categoryTextColor = isLight ? 'text-cyan-700' : 'text-cyan-400';

  return (
    <div className="w-full h-full overflow-y-auto overscroll-y-none pb-32 pt-28 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto">
        
        <div className="pb-6">
          <h2 className={`text-3xl font-light tracking-tight ${textClass}`}>
             {lang === 'de' ? 'Unsere Arbeiten' : 'Selected Work'}
          </h2>
          <p className={`text-sm mt-2 font-light ${subTextClass}`}>
            {lang === 'de' ? 'Entdecken Sie unsere aktuellsten Projekte.' : 'Explore our most recent projects.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {projects.map((project) => {
            const title = project.title;
            
            return (
            <div
              key={project.id}
              className={`w-full rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-transform active:scale-[0.98] ${bgClass}`}
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
              <div className={`relative w-full aspect-square overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-stone-900'}`}>
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
              <div className="p-2 sm:p-4 flex flex-col gap-1">
                <span className={`text-[8px] sm:text-[10px] uppercase font-semibold tracking-widest truncate ${categoryTextColor}`}>
                  {project.category}
                </span>
                
                <h3 className={`text-xs sm:text-base font-medium tracking-tight truncate leading-tight ${textClass}`}>
                  {title}
                </h3>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
