import React, { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../constants';
import { Project, Theme, TransitionRect } from '../types';
import { useInertialScroller } from '../hooks/useInertialScroller';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface PortfolioSurfaceProps {
  onSelectProject: (p: Project, rect: TransitionRect) => void;
  theme: Theme;
  isAnyModalOpen?: boolean;
}

type SurfaceBounds = {
  x: { min: number; max: number };
  y: { min: number; max: number };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const PortfolioSurface: React.FC<PortfolioSurfaceProps> = ({
  onSelectProject,
  theme,
  isAnyModalOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);

  // Camera state for transform-based 2D panning.
  const [position, setPosition] = useState({ x: -600, y: -400 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const positionRef = useRef(position);
  const reducedMotion = usePrefersReducedMotion();
  const [bounds, setBounds] = useState<SurfaceBounds>({
    x: { min: -2200, max: 0 },
    y: { min: -1800, max: 0 },
  });

  const SURFACE_WIDTH = 2840;

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateBounds = () => {
      const viewportW = container.clientWidth;
      const viewportH = container.clientHeight;
      const contentW = content.offsetWidth;
      const contentH = content.offsetHeight;

      const nextBounds: SurfaceBounds = {
        x: { min: Math.min(0, viewportW - contentW), max: 0 },
        y: { min: Math.min(0, viewportH - contentH), max: 0 },
      };

      setBounds((prev) => {
        if (
          prev.x.min === nextBounds.x.min &&
          prev.x.max === nextBounds.x.max &&
          prev.y.min === nextBounds.y.min &&
          prev.y.max === nextBounds.y.max
        ) {
          return prev;
        }
        return nextBounds;
      });

      setPosition((prev) => {
        const next = {
          x: clamp(prev.x, nextBounds.x.min, nextBounds.x.max),
          y: clamp(prev.y, nextBounds.y.min, nextBounds.y.max),
        };
        if (next.x === prev.x && next.y === prev.y) return prev;
        return next;
      });
    };

    updateBounds();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateBounds())
        : null;
    resizeObserver?.observe(container);
    resizeObserver?.observe(content);
    window.addEventListener('resize', updateBounds);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  const { stop } = useInertialScroller(containerRef, {
    enabled: !isAnyModalOpen,
    axis: 'both',
    friction: 0.94, // tune: lower = longer run-out, higher = shorter run-out
    maxVelocity: 55, // tune: cap inertial throw speed
    minVelocity: 0.4, // tune: lower keeps inertia alive longer
    bounds,
    getPosition: () => positionRef.current,
    setPosition: (next) => setPosition(next),
    onInteractionStart: () => {
      setIsDragging(false);
      setHasMoved(false);
      suppressClickRef.current = false;
    },
    onPanStart: () => {
      setIsDragging(true);
      setHasMoved(true);
      suppressClickRef.current = true;
    },
    onMove: (deltaAbs) => {
      if (deltaAbs > 0.25) setHasMoved(true);
    },
    onStop: () => setIsDragging(false),
    prefersReducedMotion: reducedMotion,
    stopWhen: isAnyModalOpen,
  });

  useEffect(() => {
    if (isAnyModalOpen) {
      stop();
      setIsDragging(false);
    }
  }, [isAnyModalOpen, stop]);

  const renderGridItems = () => {
    const items = [];
    const repetitions = 15; // Slightly reduced for performance

    const frameGradient =
      theme === 'light'
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
              if (hasMoved || suppressClickRef.current) {
                e.preventDefault();
                e.stopPropagation();
                suppressClickRef.current = false;
                return;
              }
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onSelectProject(project, {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              });
            }}
          >
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
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className={`w-full h-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-90 group-hover:opacity-100 select-none
                      ${
                        theme === 'dark'
                          ? 'rotate-[-45deg] scale-[1.45] group-hover:scale-[1.55]'
                          : 'rotate-0 scale-100 group-hover:scale-110'
                      }
                    `}
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 z-10">
                  <div
                    className={`transition-transform duration-[1500ms] ${
                      theme === 'dark'
                        ? 'rotate-[-45deg] origin-bottom-left translate-x-4 -translate-y-2'
                        : ''
                    }`}
                  >
                    <span
                      className={`${categoryTextColor} text-[7px] font-semibold uppercase tracking-widest mb-0.5 block opacity-100`}
                    >
                      {project.category}
                    </span>
                    <h3 className="text-white text-[10px] font-medium leading-tight">
                      {project.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>,
        );
      });
    }
    return items;
  };

  const hintColor = theme === 'light' ? 'text-cyan-900/60' : 'text-cyan-200/60';

  return (
    <div
      ref={containerRef}
      // Interactive pan surface: gestures inside this element control the 2D camera.
      style={{ touchAction: 'none' }}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-move select-none"
      onClickCapture={(e) => {
        if (!suppressClickRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 will-change-transform origin-center"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          width: `${SURFACE_WIDTH}px`,
          transition: isDragging ? 'none' : 'transform 1.4s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        <div className="grid grid-cols-12 gap-20 p-20 perspective-1000">{renderGridItems()}</div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-60 mix-blend-difference animate-pulse">
        <span className={`text-[10px] uppercase tracking-[0.2em] ${hintColor}`}>
          Drag to Explore
        </span>
      </div>
    </div>
  );
};
