import React, { useRef, useState, useEffect } from 'react';
import { PROJECTS } from '../constants';
import { Project, Theme, TransitionRect } from '../types';
import { useInertialScroller } from '../hooks/useInertialScroller';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface PortfolioSurfaceProps {
  onSelectProject: (p: Project, rect: TransitionRect) => void;
  theme: Theme;
  isAnyModalOpen?: boolean;
}

export const PortfolioSurface: React.FC<PortfolioSurfaceProps> = ({ onSelectProject, theme, isAnyModalOpen = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera state
  const [position, setPosition] = useState({ x: -600, y: -400 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const positionRef = useRef(position);
  const reducedMotion = usePrefersReducedMotion();
  const [bounds, setBounds] = useState<{ min: number; max: number }>({ min: -2200, max: 300 });

  useEffect(() => {
    // compute loose horizontal bounds based on surface width
    const SURFACE_WIDTH = 2840;
    const margin = 220;
    const updateBounds = () => {
      const winW = window.innerWidth;
      const min = -(SURFACE_WIDTH - winW) - margin;
      const max = margin;
      setBounds({ min, max });
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Inertial horizontal controller
  const scrollerRef = containerRef;
  useInertialScroller(scrollerRef, {
    enabled: !isAnyModalOpen,
    axis: 'x',
    friction: 0.94,
    maxVelocity: 55,
    minVelocity: 0.4,
    bounds,
    getPosition: () => positionRef.current.x,
    setPosition: (next) => setPosition(prev => ({ ...prev, x: next })),
    onMove: (deltaAbs) => {
      if (deltaAbs > 3) setHasMoved(true);
    },
    onPointerDown: () => {
      setIsDragging(true);
      setHasMoved(false);
    },
    onStop: () => setIsDragging(false),
    prefersReducedMotion: reducedMotion,
    stopWhen: isAnyModalOpen,
  });

  const renderGridItems = () => {
    const items = [];
    const repetitions = 15; // Slightly reduced for performance
    
    const frameGradient = theme === 'light' 
      ? 'bg-gradient-to-tr from-stone-200 via-cyan-200 to-stone-300' 
      : 'bg-gradient-to-tr from-stone-700 via-cyan-800 to-stone-700';

    const categoryTextColor = theme === 'light' ? 'text-cyan-700' : 'text-cyan-300';

    for (let i = 0; i < repetitions; i++) {
      PROJECTS.forEach((project, index) => {
        const key = `${project.id}-${i}-${index}`;
        items.push(
          <div
            key={key}
            className={`group relative w-full aspect-square cursor-pointer z-0 hover:z-50 
              transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              ${theme === 'dark' ? 'rotate-45 scale-90' : 'rotate-0 scale-100'}
              hover:scale-125
            `}
            onClick={(e) => {
              // Only trigger if we haven't moved significantly
              if (!hasMoved) {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                onSelectProject(project, {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height
                });
              }
            }}
          >
            {/* The Luxury Frame */}
            <div 
              className={`w-full h-full rounded-xl p-[1px] shadow-sm transition-all duration-500 group-hover:shadow-xl ${frameGradient}`}
            >
              <div 
                className={`w-full h-full relative overflow-hidden rounded-[calc(0.75rem-1px)] transition-colors duration-500 ${
                  theme === 'light' ? 'bg-[#FAFAF9]' : 'bg-[#292524]'
                }`}
              >
                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    draggable={false} // Prevent native drag
                    onDragStart={(e) => e.preventDefault()}
                    className={`w-full h-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-90 group-hover:opacity-100 select-none
                      ${theme === 'dark' 
                        ? 'rotate-[-45deg] scale-[1.45] group-hover:scale-[1.55]' 
                        : 'rotate-0 scale-100 group-hover:scale-110'
                      }
                    `}
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 z-10">
                  <div className={`transition-transform duration-[1500ms] ${theme === 'dark' ? 'rotate-[-45deg] origin-bottom-left translate-x-4 -translate-y-2' : ''}`}>
                    <span className={`${categoryTextColor} text-[7px] font-semibold uppercase tracking-widest mb-0.5 block opacity-100`}>{project.category}</span>
                    <h3 className="text-white text-[10px] font-medium leading-tight">{project.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      });
    }
    return items;
  };

  const hintColor = theme === 'light' ? 'text-cyan-900/60' : 'text-cyan-200/60';

  return (
    <div 
      ref={containerRef}
      // touch-none prevents browser scrolling, select-none prevents text selection
      // style={{ touchAction: 'none' }} ensures mobile robustness against CSS loading timing
      style={{ touchAction: 'none' }}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-move touch-none select-none"
    >
      <div 
        className="absolute top-0 left-0 will-change-transform origin-center"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          width: '2840px', // Roughly covers enough space for the grid
          transition: isDragging 
            ? 'none' 
            : 'transform 1.4s cubic-bezier(0.19, 1, 0.22, 1)', 
        }}
      >
        <div className="grid grid-cols-12 gap-20 p-20 perspective-1000">
          {renderGridItems()}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-60 mix-blend-difference animate-pulse">
        <span className={`text-[10px] uppercase tracking-[0.2em] ${hintColor}`}>Drag to Explore</span>
      </div>
    </div>
  );
};
