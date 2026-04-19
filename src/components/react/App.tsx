
import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { PortfolioSurface } from './components/PortfolioSurface';
import { PortfolioGridMobile } from './components/PortfolioGridMobile';
import { ServicesTiles } from './components/ServicesTiles';
import { ProjectDetail } from './components/ProjectDetail';
import { ThemeToggle } from './components/ThemeToggle';
import { CookieConsent } from './components/CookieConsent';
import { ContactModal } from './components/ContactModal';
import type { Project, Theme, TransitionRect } from './types';
import type { Lang } from '../../lib/i18n';

interface AppProps {
  lang?: Lang;
  projects: Project[];
  services: any[];
  categories: any[];
  initialView?: 'work' | 'services';
}

const getProjectSlug = (project: Project): string => project.slug || project.id;

const getFallbackRect = (): TransitionRect => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    top: h * 0.15,
    left: w * 0.15,
    width: w * 0.7,
    height: h * 0.7,
  };
};

const updateProjectQuery = (slug: string | null, mode: 'push' | 'replace' = 'push') => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);

  if (slug) {
    url.searchParams.set('project', slug);
  } else {
    url.searchParams.delete('project');
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  if (mode === 'push') {
    window.history.pushState({}, '', next);
  } else {
    window.history.replaceState({}, '', next);
  }
};

const App: React.FC<AppProps> = ({ lang = 'de', projects, services, categories, initialView }) => {
  console.log("App.tsx received services:", services?.length, services);

  const [view, setView] = useState<'work' | 'services'>(initialView || 'work');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [originRect, setOriginRect] = useState<TransitionRect | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactOrigin, setContactOrigin] = useState<TransitionRect | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple transition logic
  const handleViewChange = (newView: 'work' | 'services') => {
    setView(newView);
    setSelectedProject(null); // Close modal on nav
    updateProjectQuery(null, 'replace'); // clear project 
  };

  const handleSelectProject = (project: Project, rect: TransitionRect) => {
    setOriginRect(rect);
    setSelectedProject(project);
    const slug = getProjectSlug(project);
    if (typeof window !== 'undefined') {
      const current = new URLSearchParams(window.location.search).get('project');
      updateProjectQuery(slug, current === slug ? 'replace' : 'push');
    }
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    updateProjectQuery(null, 'replace');
  };

  const handleOpenContact = (rect: TransitionRect) => {
    setContactOrigin(rect);
    setIsContactOpen(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isAnyModalOpen = Boolean(selectedProject || isContactOpen || isServiceModalOpen);


  // Update body bg color to match theme for overscroll areas
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'light' ? '#A1E4ED' : '#1C1917';
  }, [theme]);

  const syncStateFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('project');

    // Note: We deliberately do not reset `view` based on `initialView` 
    // here during sync state, because otherwise navigating "back" from a modal
    // would abruptly snap the user back to the initial page view context.
    // The user's dynamic local React `view` state is safely preserved.

    // 2. Handle Project Deep Link
    if (!slug) {
      setSelectedProject(null);
      return;
    }

    const projectFromSlug = projects.find((p) => getProjectSlug(p) === slug);
    if (!projectFromSlug) return;

    // Force work view if opening a project directly
    setView('work');
    setSelectedProject(projectFromSlug);
    setOriginRect((prev) => prev ?? getFallbackRect());
  }, [projects]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Initial sync
    syncStateFromUrl();

    // Listen for browser back/forward
    window.addEventListener('popstate', syncStateFromUrl);

    // Listen for custom view change events (e.g. from Hero CTAs in a separate React island)
    const handleCustomViewChange = (e: Event) => {
      const customEvent = e as CustomEvent<'work' | 'services'>;
      setView(customEvent.detail);
      setSelectedProject(null);
    };
    window.addEventListener('ph-view-change', handleCustomViewChange);

    return () => {
      window.removeEventListener('popstate', syncStateFromUrl);
      window.removeEventListener('ph-view-change', handleCustomViewChange);
    };
  }, [syncStateFromUrl]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-900">

      {/* --- AMBIENT BACKGROUND LAYERS (CROSS-FADE) --- */}

      {/* DARK MODE LAYER */}
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="absolute inset-0 bg-[#1C1917]" />
        {/* Deep Aqua Aurora - More visible (opacity 0.3) */}
        <div className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vh] bg-cyan-900/30 rounded-full blur-[100px] animate-aurora-1 mix-blend-screen" />
        {/* Teal/Purple Aurora - More visible */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vh] bg-teal-900/30 rounded-full blur-[80px] animate-aurora-2 mix-blend-screen" />
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* LIGHT MODE LAYER */}
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${theme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="absolute inset-0 bg-[#A1E4ED]" />
        {/* Aqua Sky Hint - More visible */}
        <div className="absolute top-[10%] right-[20%] w-[70vw] h-[70vw] bg-cyan-100/70 rounded-full blur-[120px] animate-cloud mix-blend-multiply" />
        {/* White Cloud Fog */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[100vw] h-[100vh] bg-white rounded-full blur-[100px] animate-aurora-2 opacity-90" />
        {/* Another Cloud Chunk */}
        <div className="absolute top-[-20%] left-[10%] w-[60vw] h-[60vh] bg-stone-100/80 rounded-full blur-[80px] animate-aurora-1" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 w-full h-full">
        <Navigation
          currentView={view}
          onNavigate={handleViewChange}
          onOpenContact={handleOpenContact}
          onSelectProject={handleSelectProject}
          projects={projects}
          lang={lang}
          isAnyModalOpen={isAnyModalOpen}
          isServiceDetailOpen={isServiceModalOpen}
          theme={theme}
        />

        {/* Work View */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${view === 'work' ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
        >
          {isMobile ? (
            <PortfolioGridMobile
              projects={projects}
              lang={lang}
              onSelectProject={handleSelectProject}
              theme={theme}
            />
          ) : (
            <PortfolioSurface
              projects={projects}
              lang={lang}
              onSelectProject={handleSelectProject}
              theme={theme}
            />
          )}
        </div>

        {/* Services View */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${view === 'services' ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
        >
          <ServicesTiles
            services={services}
            categories={categories}
            lang={lang}
            theme={theme}
            onModalToggle={setIsServiceModalOpen}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProject && originRect && (
        <ProjectDetail
          project={selectedProject}
          originRect={originRect}
          onClose={handleCloseProject}
          lang={lang}
          theme={theme}
        />
      )}

      {/* Contact Modal */}
      {isContactOpen && (
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          originRect={contactOrigin}
          services={services}
          theme={theme}
        />
      )}

      {/* Theme Toggle */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Creative Cookie Banner */}
      <CookieConsent theme={theme} />
    </div>
  );
};

export default App;
