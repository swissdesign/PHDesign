import React, { useState, useEffect } from 'react';
import type { Theme, TransitionRect, Project } from '../types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'work' | 'services') => void;
  onOpenContact: (rect: TransitionRect) => void;
  onSelectProject: (project: Project, rect: TransitionRect) => void;
  projects: Project[];
  originRect: TransitionRect | null;
  theme: Theme;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, onNavigate, onOpenContact, onSelectProject, projects, originRect, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentLang, setCurrentLang] = useState('DE');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true);
          setTimeout(() => setShowContent(true), 400);
        });
      });
    } else {
      setShowContent(false);
      setIsExpanded(false);
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !originRect) return null;

  const bgClass = theme === 'light' ? 'bg-[#FAFAF9]' : 'bg-[#1C1917]';
  const textClass = theme === 'light' ? 'text-stone-900' : 'text-stone-100';
  const subTextClass = theme === 'light' ? 'text-stone-500' : 'text-stone-400';
  const borderClass = theme === 'light' ? 'border-stone-200' : 'border-stone-800';
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-stone-900';

  // Aqua Accents
  const activeLangClass = theme === 'light' ? 'text-cyan-900 font-medium' : 'text-cyan-200 font-medium';
  const hoverTextAccent = theme === 'light' ? 'hover:text-cyan-700' : 'hover:text-cyan-200';
  const hoverBorderAccent = theme === 'light' ? 'hover:border-cyan-900/30' : 'hover:border-cyan-500/30';
  const buttonIconGroupHover = theme === 'light' ? 'group-hover:bg-cyan-900 group-hover:text-white' : 'group-hover:bg-cyan-200 group-hover:text-stone-900';
  
  // Specific word highlight color
  const highlightWordClass = theme === 'light' ? 'text-cyan-700 font-medium' : 'text-cyan-300 font-medium';

  // Contact Button Shadow (Blue Tint)
  const contactShadow = theme === 'light' 
    ? 'hover:shadow-[0_20px_40px_-10px_rgba(8,145,178,0.15)]' 
    : 'hover:shadow-[0_20px_40px_-10px_rgba(34,211,238,0.1)]';

  const latestProjects = projects.slice(0, 3);

  const handleNavClick = (view: 'work' | 'services') => {
    onNavigate(view);
    onClose();
  };
  
  const handleContactClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onOpenContact({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
  };
  
  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('p-heiniger-open-cookies'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-700 ease-in-out ${
          isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        } ${theme === 'light' ? 'bg-white/60' : 'bg-black/60'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed shadow-2xl overflow-hidden flex flex-col transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) pointer-events-auto ${bgClass}`}
        style={{
          top: isExpanded ? '5%' : `${originRect.top}px`,
          left: isExpanded ? '5%' : `${originRect.left}px`,
          width: isExpanded ? '90%' : `${originRect.width}px`,
          height: isExpanded ? '90%' : `${originRect.height}px`,
          borderRadius: isExpanded ? '0px' : '20px',
          opacity: 1
        }}
      >
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center p-6 md:p-8 border-b ${borderClass} transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center w-full md:w-auto">
            <span className={`text-xs uppercase tracking-widest ${subTextClass}`}>Menu & Settings</span>
            <button 
                onClick={onClose}
                className={`md:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors ${theme === 'light' ? 'hover:bg-stone-200' : 'hover:bg-stone-800'} ${textClass}`}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
          </div>

          <div className={`mt-4 md:mt-0 md:ml-12 flex flex-col md:flex-row gap-4 md:gap-8 md:items-center text-[10px] uppercase tracking-widest ${subTextClass} flex-1`}>
            <div className="flex gap-4">
                {['DE', 'EN', 'FR', 'IT'].map((lang) => (
                    <button 
                        key={lang}
                        onClick={() => setCurrentLang(lang)}
                        className={`transition-colors ${currentLang === lang ? activeLangClass : `opacity-50 hover:opacity-100 ${hoverTextAccent}`}`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            <div className="hidden md:block h-3 w-px bg-current opacity-20" />

            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <a 
                    href="/iam.html" 
                    className={`hover:underline ${hoverTextAccent}`}
                    onClick={onClose}
                >
                    iam
                </a>
                <a href="#" className={`hover:underline ${hoverTextAccent}`}>Impressum</a>
                <a href="#" className={`hover:underline ${hoverTextAccent}`}>Datenschutz</a>
                <a href="#" className={`hover:underline ${hoverTextAccent}`}>AGB</a>
                <button 
                    onClick={handleOpenCookieSettings}
                    className={`hover:underline ${hoverTextAccent}`}
                    title="Manage Cookie Preferences"
                >
                    Cookies
                </button>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`hidden md:flex w-10 h-10 items-center justify-center rounded-full transition-colors ${theme === 'light' ? 'hover:bg-stone-200' : 'hover:bg-stone-800'} ${textClass}`}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto scroll-smooth transition-opacity duration-500 delay-100 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-6 md:p-10 space-y-12 max-w-5xl mx-auto pb-20">
            
            {/* Navigation */}
            <section>
              <nav className="flex flex-col gap-4">
                <button 
                  onClick={() => handleNavClick('work')}
                  className={`text-4xl md:text-6xl text-left font-light tracking-tighter hover:tracking-wide transition-all duration-500 whitespace-nowrap group ${textClass}`}
                >
                  <span className={`${theme === 'light' ? 'group-hover:text-cyan-900' : 'group-hover:text-cyan-200'} transition-colors`}>Selected</span> Work
                </button>
                <button 
                  onClick={() => handleNavClick('services')}
                  className={`text-4xl md:text-6xl text-left font-light tracking-tighter hover:tracking-wide transition-all duration-500 whitespace-nowrap group ${textClass}`}
                >
                  Studio <span className={`${theme === 'light' ? 'group-hover:text-cyan-900' : 'group-hover:text-cyan-200'} transition-colors`}>Services</span>
                </button>
              </nav>
            </section>

            {/* Latest Projects */}
            <section>
              <h3 className={`text-xs uppercase tracking-widest mb-6 ${subTextClass}`}>Latest Projects</h3>
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {latestProjects.map(p => (
                  <div 
                    key={p.id} 
                    className={`flex-none w-[280px] md:w-[350px] snap-start rounded-lg overflow-hidden group cursor-pointer border ${borderClass} ${cardBg} ${hoverBorderAccent}`}
                    onClick={(e) => {
                      if (isClosing) return;
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      onSelectProject(p, {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                      });
                    }}
                    aria-disabled={isClosing}
                  >
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={p.title} />
                      {/* Random blue line overlay on hover */}
                      <div className={`absolute bottom-0 left-0 h-1 bg-cyan-500 transition-all duration-500 w-0 group-hover:w-full`} />
                    </div>
                    <div className="p-4">
                      <h4 className={`text-sm font-medium ${textClass} group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors`}>{p.title}</h4>
                      <p className={`text-xs mt-1 ${subTextClass}`}>{p.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="max-w-3xl">
               <h3 className={`text-xs uppercase tracking-widest mb-6 ${subTextClass}`}>Direct Contact</h3>
               
               <button
                 onClick={handleContactClick}
                 className={`group w-full text-left p-8 md:p-10 rounded-2xl border transition-all duration-500 hover:scale-[1.01] ${borderClass} ${cardBg} ${hoverBorderAccent} ${contactShadow}`}
               >
                  <div className="flex items-start justify-between">
                     <div>
                        <h4 className={`text-2xl md:text-3xl font-light mb-2 ${textClass} group-hover:text-cyan-900 dark:group-hover:text-cyan-100 transition-colors`}>Start a Project</h4>
                        <p className={`text-sm md:text-base max-w-md ${subTextClass}`}>
                           Have an idea? Let's discuss how we can bring it to life with <span className={highlightWordClass}>precision</span> and <span className={highlightWordClass}>quiet luxury</span>.
                        </p>
                     </div>
                     <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${buttonIconGroupHover} ${theme === 'light' ? 'border-stone-200' : 'border-stone-700'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <line x1="5" y1="12" x2="19" y2="12"></line>
                           <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                     </div>
                  </div>
               </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
