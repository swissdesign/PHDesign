import React, { useEffect, useState } from 'react';

// TODO: Replace with actual deployed path if it differs from /ph-logo.svg
const LOGO_PATH = '/ph-logo.svg';

interface IntroLogoSceneProps {
  studioLabel: string;
  /** Unused in normal mode (overlay handles reducedMotion separately), kept for API consistency */
  reducedMotion: boolean;
}

/**
 * Scene 1 — Logo + "design studio."
 *
 * A plain 100vh section inside the fixed overlay.
 * Fades in on mount. The user scrolls past it to continue.
 * No timers, no auto-exit. Simple and robust.
 */
export function IntroLogoScene({ studioLabel }: IntroLogoSceneProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so the initial paint is complete before animation begins
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#fafaf9',
        userSelect: 'none',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 'clamp(72px, 14vw, 180px)',
          color: '#1c1917',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1), transform 700ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* TODO: if SVG not yet at /ph-logo.svg, swap for inline SVG or adjust path */}
        <img
          src={LOGO_PATH}
          alt="PH — Pascal Heiniger"
          width={252}
          height={235}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* "design studio." */}
      <p
        style={{
          marginTop: 'clamp(14px, 2.5vw, 28px)',
          fontSize: 'clamp(10px, 1.2vw, 14px)',
          letterSpacing: '0.24em',
          textTransform: 'lowercase',
          color: '#1c1917',
          opacity: visible ? 0.45 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 700ms 200ms cubic-bezier(0.4,0,0.2,1), transform 700ms 200ms cubic-bezier(0.4,0,0.2,1)',
          fontWeight: 400,
          fontFamily: 'inherit',
          margin: 0,
          marginTop: 'clamp(14px, 2.5vw, 28px)',
        }}
      >
        {studioLabel}
      </p>

      {/* Scroll hint */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 5vh, 48px)',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: visible ? 0.28 : 0,
          transition: 'opacity 700ms 800ms cubic-bezier(0.4,0,0.2,1)',
          color: '#1c1917',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'ph-arrow-bob 2.4s ease-in-out infinite' }}
        >
          <polyline points="4 7 9 13 14 7" />
        </svg>
      </div>
    </section>
  );
}
