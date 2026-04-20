import React, { useEffect, useRef, useState } from 'react';

// ─── Logo path ─────────────────────────────────────────────────────────────
// TODO: Replace with actual SVG path once /public/ph-logo.svg is confirmed deployed.
const LOGO_PATH = '/ph-logo.svg';

interface IntroLogoSceneProps {
  /** "design studio." or equivalent copy */
  studioLabel: string;
  /** Whether the scene should skip animation (reduced motion / SSR) */
  reducedMotion: boolean;
  /** Called when the logo scene has fully exited so parent can advance */
  onExited: () => void;
}

export function IntroLogoScene({ studioLabel, reducedMotion, onExited }: IntroLogoSceneProps) {
  // visible | exiting | exited
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'exited'>('visible');
  const hasExitedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion: skip animation, hold visible, let parent decide via scroll
      return;
    }

    // Sequence:
    //   0ms       — scene appears (CSS fade-in via class)
    //   1600ms    — begin exit animation
    //   2200ms    — scene fully gone, notify parent
    const exitTimer = setTimeout(() => setPhase('exiting'), 1600);
    const doneTimer = setTimeout(() => {
      if (!hasExitedRef.current) {
        hasExitedRef.current = true;
        setPhase('exited');
        onExited();
      }
    }, 2200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [reducedMotion, onExited]);

  if (phase === 'exited') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafaf9',
        // Fade in on mount, fade+slide up on exit
        opacity: phase === 'exiting' ? 0 : 1,
        transform: phase === 'exiting' ? 'translateY(-24px)' : 'translateY(0)',
        transition: reducedMotion
          ? 'none'
          : 'opacity 500ms cubic-bezier(0.4,0,0.2,1), transform 500ms cubic-bezier(0.4,0,0.2,1)',
        animation: reducedMotion ? 'none' : 'ph-logo-fadein 600ms cubic-bezier(0.4,0,0.2,1) both',
      }}
    >
      <style>{`
        @keyframes ph-logo-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Logo */}
      <div
        style={{
          width: 'clamp(80px, 18vw, 200px)',
          color: '#1c1917',
        }}
      >
        {/* TODO: if /public/ph-logo.svg is not yet deployed, replace <img> with inline SVG */}
        <img
          src={LOGO_PATH}
          alt="PH — Pascal Heiniger"
          width={252}
          height={235}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onError={(e) => {
            // Graceful fallback if SVG is missing
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* "design studio." */}
      <p
        style={{
          marginTop: 'clamp(16px, 3vw, 32px)',
          fontSize: 'clamp(11px, 1.4vw, 15px)',
          letterSpacing: '0.22em',
          textTransform: 'lowercase',
          color: '#1c1917',
          fontWeight: 400,
          fontFamily: 'inherit',
          opacity: 0.55,
          animation: reducedMotion ? 'none' : 'ph-logo-fadein 600ms 300ms cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        {studioLabel}
      </p>
    </div>
  );
}
