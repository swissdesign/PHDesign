import React, { useEffect, useState } from 'react';
import type { Project, Theme, TransitionRect } from '../types';
import type { Lang } from '../../../lib/i18n';
import { pickLang, pickLangArray, toTextArray } from '../utils/pickLang';

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

  const projectTitle = pickLang(project, 'title', lang) || project.title || 'Untitled Project';
  const projectDescription = pickLang(project, 'description', lang) || project.description || '';
  const projectCategory = pickLang(project, 'category', lang) || String(project.category ?? '').trim();
  const projectDate = String(project.date ?? '').trim();
  const projectImage = String(project.image ?? '').trim() || DEFAULT_PROJECT_IMAGE;
  const projectTagsFromSheet = pickLangArray(project, 'tags', lang);
  const projectTags = projectTagsFromSheet.length > 0 ? projectTagsFromSheet : toTextArray(project.tags);
  const projectId = String(project.id ?? project.slug ?? '').trim();
  
  const galleryImages = [
    projectImage, 
    `${projectImage}?grayscale`, 
    `${projectImage}?blur`, 
    projectImage
  ];

  useEffect(() => {
    // Start animation immediately after mount
    const timer1 = setTimeout(() => setIsExpanded(true), 20);
    const timer2 = setTimeout(() => setShowContent(true), 500); 

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setIsExpanded(false);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  // Theme styling constants
  const bgClass = theme === 'light' ? 'bg-white' : 'bg-[#1C1917]';
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-600' : 'text-stone-400';
  const borderClass = theme === 'light' ? 'border-stone-100' : 'border-stone-800';
  const isDark = theme === 'dark';

  // Accents
  const linkHoverClass = theme === 'light' ? 'hover:text-cyan-800 hover:border-cyan-800' : 'hover:text-cyan-200 hover:border-cyan-200';
  const tagClass = theme === 'light' 
    ? 'bg-stone-50 text-stone-600 border-stone-100 hover:border-cyan-900/20 hover:text-cyan-900' 
    : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-cyan-500/30 hover:text-cyan-200';
  const dotActive = theme === 'light' ? 'bg-cyan-600 h-3' : 'bg-cyan-400 h-3';

  // Animation Transforms for Dark Mode (Diamond -> Square transition)
  const initialRotate = isDark ? 45 : 0;
  const initialScale = isDark ? 0.707 : 1; 

  const outerTransform = (isExpanded && !isClosing)
    ? 'rotate(0deg) scale(1)' 
    : `rotate(${initialRotate}deg) scale(${initialScale})`;

  const innerTransform = (isExpanded && !isClosing)
    ? 'rotate(0deg) scale(1)'
    : `rotate(${-initialRotate}deg) scale(${isDark ? 1.42 : 1})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-md transition-all duration-700 ease-in-out ${
          isExpanded && !isClosing ? 'opacity-100' : 'opacity-0'
        } ${theme === 'light' ? 'bg-[#FAFAF9]/90' : 'bg-black/90'}`}
        onClick={handleClose}
      ></div>

      {/* The Card Container */}
      <div 
        className={`fixed shadow-2xl overflow-hidden transition-all duration-700 cubic-bezier(0.76, 0, 0.24, 1) ${bgClass}`}
        style={{
          top: isExpanded ? '5%' : `${originRect.top}px`,
          left: isExpanded ? '5%' : `${originRect.left}px`,
          width: isExpanded ? '90%' : `${originRect.width}px`,
          height: isExpanded ? '90%' : `${originRect.height}px`,
          borderRadius: isExpanded ? '0px' : '1.5rem', 
          zIndex: 60,
          transform: outerTransform,
          transformOrigin: 'center center'
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
            className={`absolute top-6 right-6 z-30 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-500 delay-300 ${
              theme === 'light' ? 'bg-white/50 hover:bg-white text-black' : 'bg-black/50 hover:bg-stone-800 text-white'
            } ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>

          {/* Media Side (Left) */}
          <div className={`relative group transition-all duration-700 ${isExpanded ? 'w-full md:w-3/5 h-1/2 md:h-full' : 'w-full h-full'}`}>
            <div className={`w-full h-full ${isExpanded ? 'overflow-y-auto snap-y snap-mandatory scroll-smooth' : 'overflow-hidden'}`} style={{ scrollbarWidth: 'none' }}>
              {galleryImages.map((imgSrc, index) => (
                <div key={index} className="w-full h-full snap-start relative">
                  <img 
                    src={imgSrc} 
                    alt={`${projectTitle} view ${index + 1}`} 
                    className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${isExpanded ? 'scale-100' : 'scale-110'}`}
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
            
            {/* Blue accented scroll indicator */}
            <div className={`absolute bottom-6 right-6 text-cyan-200 text-[10px] uppercase tracking-widest animate-pulse transition-opacity duration-500 pointer-events-none z-20 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              Scroll / Swipe
            </div>
          </div>

          {/* Info Side (Right) */}
          <div 
            className={`transition-all duration-500 flex flex-col ${isExpanded ? 'w-full md:w-2/5 h-1/2 md:h-full opacity-100' : 'w-0 h-0 opacity-0 overflow-hidden'} ${bgClass}`}
          >
            <div className={`w-full h-full overflow-y-auto p-8 md:p-12 flex flex-col transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex-1">
                <span className="text-xs text-stone-400 font-mono mb-4 block">{projectId.toUpperCase()} — {projectDate}</span>
                <h2 className={`text-3xl md:text-5xl font-light tracking-tight mb-8 ${textClass}`}>{projectTitle}</h2>
                
                <div className={`space-y-6 text-sm md:text-lg leading-relaxed font-light max-w-md ${subTextClass}`}>
                  {projectDescription && <p>{projectDescription}</p>}
                  <p>
                    Wir haben uns darauf konzentriert, die Essenz der Marke herauszuarbeiten. 
                    Weniger Lärm, mehr Signal. Das Ergebnis ist eine Plattform, die Ruhe ausstrahlt.
                  </p>
                </div>

                {project.clientUrl && (
                  <a 
                    href={project.clientUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-block mt-12 text-xs uppercase tracking-widest border-b pb-1 transition-all ${theme === 'light' ? 'border-stone-900 text-stone-900' : 'border-stone-100 text-stone-100'} ${linkHoverClass}`}
                  >
                    Visit Live Site ↗
                  </a>
                )}
              </div>

              <div className={`mt-12 pt-6 border-t ${borderClass}`}>
                <h4 className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">Deliverables</h4>
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
