import React, { useRef, useState, useEffect } from 'react';
import { PROJECTS } from '../constants';
import { Project, Theme, TransitionRect } from '../types';

interface PortfolioSurfaceProps {
  onSelectProject: (p: Project, rect: TransitionRect) => void;
  theme: Theme;
}

export const PortfolioSurface: React.FC<PortfolioSurfaceProps> = ({ onSelectProject, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera state
  const [position, setPosition] = useState({ x: -600, y: -400 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  
  // Refs for drag math to avoid closure staleness and heavy state churn during calculation
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  // Physics constants for the "Airy 5x5" view
  const SNAP_CONFIG = {
    colWidth: 150,
    gap: 80,
    padding: 80,
  };

  const snapToGrid = (currentX: number, currentY: number) => {
    const { colWidth, gap, padding } = SNAP_CONFIG;
    const stride = colWidth + gap;
    const startOffset = padding + (colWidth / 2); 

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const gridCenterX = (winW / 2) - currentX;
    const gridCenterY = (winH / 2) - currentY;

    const rawColIndex = Math.round((gridCenterX - startOffset) / stride);
    const rawRowIndex = Math.round((gridCenterY - startOffset) / stride);

    const totalItems = PROJECTS.length * 15; // Adjusted repetitions
    const cols = 12; 
    const rows = Math.ceil(totalItems / cols);

    const colIndex = Math.max(0, Math.min(rawColIndex, cols - 1));
    const rowIndex = Math.max(0, Math.min(rawRowIndex, rows - 1));

    const snapX = (winW / 2) - (startOffset + colIndex * stride);
    const snapY = (winH / 2) - (startOffset + rowIndex * stride);

    setPosition({ x: snapX, y: snapY });
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Critical: Prevent default to stop text selection and native drag behaviors
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: position.x, y: position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Threshold for "click" vs "drag"
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setHasMoved(true);
    }

    setPosition({ 
      x: startPosRef.current.x + dx, 
      y: startPosRef.current.y + dy 
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      snapToGrid(position.x, position.y);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // e.preventDefault(); // Don't prevent default here or clicks might not fire on some devices
    setIsDragging(true);
    setHasMoved(false);
    
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    startPosRef.current = { x: position.x, y: position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    // Critical: Prevent default to stop scrolling the page
    // Note: Touch events in React are passive by default, but e.preventDefault() usually works if the container has touch-action: none
    // If not, we rely on CSS touch-action: none.
    
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setHasMoved(true);
    }

    setPosition({ 
      x: startPosRef.current.x + dx, 
      y: startPosRef.current.y + dy 
    });
  };

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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
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