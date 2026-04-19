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
  const textClass = isLight ? 'text-brand-teal-dark' : 'text-brand-teal-lightAccent';
  const subTextClass = isLight ? 'text-brand-teal-dark/60' : 'text-brand-teal-lightAccent/60';
  const categoryTextColor = isLight ? 'text-brand-pink' : 'text-brand-pink-light';
  const bgClass = isLight
    ? 'bg-white/90 shadow-sm border border-brand-teal-dark/10'
    : 'bg-brand-teal-dark/80 shadow-md border border-brand-teal-lightAccent/10';

  // Feature card: first project gets a wide spotlight treatment
  const [featured, ...rest] = projects;

  const makeClickHandler = (project: Project) => (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSelectProject(project, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto overscroll-y-none pb-32 pt-28 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Section header */}
        <div className="pb-6">
          <h2 className={`text-3xl font-light tracking-tight ${textClass}`}>
            {lang === 'de' ? 'Ausgewählte Arbeiten' : 'Selected Work'}
          </h2>
          <p className={`text-sm mt-2 font-light ${subTextClass}`}>
            {lang === 'de'
              ? 'Qualität, die für sich spricht.'
              : 'Quality that speaks for itself.'}
          </p>
        </div>

        {/* Featured first project — full width, taller image */}
        {featured && (
          <div
            className={`w-full rounded-2xl overflow-hidden cursor-pointer mb-4 sm:mb-6 active:scale-[0.99] transition-transform ${bgClass}`}
            onClick={makeClickHandler(featured)}
          >
            <div className={`relative w-full aspect-[16/9] overflow-hidden ${isLight ? 'bg-brand-teal-dark/5' : 'bg-black/40'}`}>
              <img
                src={featured.optimizedSrc || featured.image}
                srcSet={featured.optimizedSrcSet}
                sizes="(max-width: 768px) 100vw, 768px"
                alt={featured.title}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
              {/* Gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              {/* Overlay text */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <span className={`text-[10px] sm:text-xs uppercase font-semibold tracking-widest block mb-1 ${categoryTextColor}`}>
                  {featured.category}
                </span>
                <h3 className="text-white text-lg sm:text-2xl font-medium tracking-tight leading-tight">
                  {featured.title}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Remaining projects — 1 column on phones, 2 columns on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {rest.map((project) => (
            <div
              key={project.id}
              className={`w-full rounded-2xl overflow-hidden cursor-pointer flex flex-col active:scale-[0.98] transition-transform ${bgClass}`}
              onClick={makeClickHandler(project)}
            >
              {/* Image — 4:3 ratio, better for design/photo work */}
              <div className={`relative w-full aspect-[4/3] overflow-hidden ${isLight ? 'bg-brand-teal-dark/5' : 'bg-black/40'}`}>
                <img
                  src={project.optimizedSrc || project.image}
                  srcSet={project.optimizedSrcSet}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 flex flex-col gap-1">
                <span className={`text-[10px] sm:text-xs uppercase font-semibold tracking-widest ${categoryTextColor}`}>
                  {project.category}
                </span>
                <h3 className={`text-sm sm:text-base font-medium tracking-tight leading-snug ${textClass}`}>
                  {project.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
