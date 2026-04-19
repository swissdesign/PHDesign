import React, { useEffect, useState } from 'react';
import type { Project, Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';


interface ProjectDetailProps {
  project: Project;
  originRect: TransitionRect;
  onClose: () => void;
  lang?: Lang;
  theme: Theme;
}

const DEFAULT_PROJECT_IMAGE = 'https://picsum.photos/1200/900';

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, originRect, onClose, lang = 'de', theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setIsExpanded(false);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const mql = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = (e: MediaQueryListEvent) => setIsCoarsePointer(e.matches);
    setIsCoarsePointer(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handlePointerChange);
    } else {
      // @ts-ignore Safari
      mql.addListener(handlePointerChange);
    }

    // Start animation immediately after mount
    const timer1 = setTimeout(() => setIsExpanded(true), 20);
    const timer2 = setTimeout(() => setShowContent(true), 500);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handlePointerChange);
      } else {
        // @ts-ignore Safari
        mql.removeListener(handlePointerChange);
      }
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isClosing, onClose]);

  const projectTitle = project.title || 'Untitled Project';
  const projectDescription = project.description || '';
  const projectCategory = project.category || '';
  const projectDate = String(project.date ?? '').trim();
  const projectImage = project.optimizedSrc || String(project.image ?? '').trim() || DEFAULT_PROJECT_IMAGE;
  const projectSrcSet = project.optimizedSrcSet || undefined;

  const projectTags = project.tags || [];
  const projectId = String(project.id ?? project.slug ?? '').trim();

  const galleryImages = [
    { src: projectImage, srcSet: projectSrcSet, className: '' },
    { src: projectImage, srcSet: projectSrcSet, className: 'grayscale' },
    { src: projectImage, srcSet: projectSrcSet, className: 'blur-sm' },
    { src: projectImage, srcSet: projectSrcSet, className: '' }
  ];

  // Theme styling constants
  const bgClass = theme === 'light' ? 'bg-white' : 'bg-brand-teal-dark';
  const textClass = theme === 'light' ? 'text-brand-teal-dark' : 'text-brand-teal-lightAccent';
  const subTextClass = theme === 'light' ? 'text-brand-teal-dark/70' : 'text-brand-teal-lightAccent/70';
  const borderClass = theme === 'light' ? 'border-brand-teal-dark/10' : 'border-brand-teal-lightAccent/10';
  const isDark = theme === 'dark';

  // Accents
  const linkHoverClass = theme === 'light' ? 'hover:text-brand-pink hover:border-brand-pink' : 'hover:text-brand-pink-light hover:border-brand-pink-light';
  const tagClass = theme === 'light'
    ? 'bg-brand-teal-dark/5 text-brand-teal-dark/70 border-brand-teal-dark/10 hover:border-brand-pink/20 hover:text-brand-pink'
    : 'bg-black/30 text-brand-teal-lightAccent/70 border-brand-teal-lightAccent/10 hover:border-brand-pink-light/30 hover:text-brand-pink-light';
  const dotActive = theme === 'light' ? 'bg-brand-pink h-3' : 'bg-brand-pink-light h-3';

  // Animation Transforms for Dark Mode (Diamond -> Square transition)
  const initialRotate = isDark && !isMobile ? 45 : 0;
  const initialScale = isDark && !isMobile ? 0.707 : 1;

  const outerTransform = (isExpanded && !isClosing)
    ? 'none'
    : `rotate(${initialRotate}deg) scale(${initialScale})`;

  const innerTransform = (isExpanded && !isClosing)
    ? 'none'
    : `rotate(${-initialRotate}deg) scale(${isDark && !isMobile ? 1.42 : 1})`;

  const expandedStyle = isMobile ? {
    top: 0,
    left: 0,
    width: '100%',
    height: '100dvh', // Use dvh for robust mobile height
    borderRadius: '0px',
    transform: outerTransform,
    transformOrigin: 'center center'
  } : {
    top: '5%',
    left: '5%',
    width: '90%',
    height: '90%',
    borderRadius: '0px',
    transform: outerTransform,
    transformOrigin: 'center center'
  };

  const initialStyle = {
    top: `${originRect.top}px`,
    left: `${originRect.left}px`,
    width: `${originRect.width}px`,
    height: `${originRect.height}px`,
    borderRadius: '1.5rem',
    transform: outerTransform,
    transformOrigin: 'center center'
  };

  const needsTopSpacing = isCoarsePointer || isMobile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-md transition-all duration-700 ease-in-out ${isExpanded && !isClosing ? 'opacity-100' : 'opacity-0'
          } ${theme === 'light' ? 'bg-brand-teal-light/90' : 'bg-black/90'}`}
        onClick={handleClose}
      ></div>

      {/* The Card Container */}
      <div
        className={`fixed shadow-2xl overflow-hidden transition-all duration-700 cubic-bezier(0.76, 0, 0.24, 1) ${bgClass}`}
        style={{
          ...((isExpanded && !isClosing) ? expandedStyle : initialStyle),
          zIndex: 60
        }}
      >
        {/* Inner Content Wrapper - Counter Rotation */}
        <div
          className="w-full h-full flex flex-col md:flex-row transition-transform duration-700 cubic-bezier(0.76, 0, 0.24, 1)"
          style={{ transform: innerTransform, transformOrigin: 'center center' }}
        >

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute md:top-6 md:right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-500 delay-300 ${theme === 'light' ? 'bg-white/50 hover:bg-white text-black' : 'bg-black/50 hover:bg-brand-teal-dark text-white'
              } ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-75'}`}
            style={needsTopSpacing ? { top: 'calc(env(safe-area-inset-top, 0px) + 18px)', right: '18px', position: 'fixed' } : undefined}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Media Side (Left) */}
          <div className={`relative group transition-all duration-700 bg-stone-100 dark:bg-stone-900 ${isExpanded ? 'w-full md:w-3/5 h-[40vh] md:h-full shrink-0' : 'w-full h-full'}`}>
            <div className={`w-full h-full ${isExpanded ? 'overflow-y-auto snap-y snap-mandatory scroll-smooth' : 'overflow-hidden'}`} style={{ scrollbarWidth: 'none' }}>
              {galleryImages.map((imgDef, index) => (
                <div key={index} className="w-full h-full snap-start relative aspect-[4/3] md:aspect-auto">
                  <img
                    src={imgDef.src}
                    srcSet={imgDef.srcSet}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    alt={`${projectTitle} view ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding={index === 0 ? "sync" : "async"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${isExpanded ? 'scale-100' : 'scale-110'} ${imgDef.className}`}
                  />
                  {/* Pagination Dots */}
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                    {galleryImages.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${index === dotIndex ? dotActive : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`absolute bottom-6 left-6 px-3 py-1 text-xs uppercase tracking-wider transition-opacity duration-500 pointer-events-none z-20 backdrop-blur ${showContent ? 'opacity-100' : 'opacity-0'} ${theme === 'light' ? 'bg-white/80 text-black' : 'bg-black/80 text-white'}`}>
              {projectCategory}
            </div>

            {/* Brand pink scroll indicator */}
            <div className={`absolute bottom-6 right-6 ${theme === 'light' ? 'text-brand-pink' : 'text-brand-pink-light'} text-[10px] uppercase tracking-widest animate-pulse transition-opacity duration-500 pointer-events-none z-20 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              Scroll / Swipe
            </div>
          </div>

          {/* Info Side (Right) */}
          <div
            className={`transition-all duration-500 flex flex-col ${isExpanded ? 'w-full md:w-2/5 flex-1 md:h-full opacity-100' : 'w-0 h-0 opacity-0 overflow-hidden'} ${bgClass}`}
            style={needsTopSpacing && isExpanded ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' } : undefined}
          >
            <div className={`w-full h-full overflow-y-auto p-8 md:p-12 flex flex-col transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex-1">
                <span className={`text-xs ${theme === 'light' ? 'text-brand-teal-dark/50' : 'text-brand-teal-lightAccent/50'} font-mono mb-4 block`}>{projectId.toUpperCase()} — {projectDate}</span>
                <h2 className={`text-3xl md:text-5xl font-light tracking-tight mb-8 ${textClass}`}>{projectTitle}</h2>

                <div className={`space-y-6 text-sm md:text-lg leading-relaxed font-light max-w-md ${subTextClass}`}>
                  {projectDescription && <p>{projectDescription}</p>}
                </div>

                {project.clientUrl && (
                  <a
                    href={project.clientUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-12 text-xs uppercase tracking-widest border-b pb-1 transition-all ${theme === 'light' ? 'border-brand-teal-dark text-brand-teal-dark' : 'border-brand-teal-lightAccent text-brand-teal-lightAccent'} ${linkHoverClass}`}
                  >
                    Visit Live Site ↗
                  </a>
                )}
              </div>

              <div className={`mt-12 pt-6 border-t ${borderClass}`}>
                <h4 className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-brand-teal-dark/50' : 'text-brand-teal-lightAccent/50'} mb-3`}>Deliverables</h4>
                <div className="flex flex-wrap gap-2">
                  {(projectTags ?? []).map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${tagClass}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
