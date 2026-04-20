import React, { useEffect, useRef, useState } from 'react';

interface IntroStatementSceneProps {
  statement1: string;
  statement2: string;
  reducedMotion: boolean;
  /** The fixed scrollable overlay div — used as IO root so scroll inside it triggers reveals */
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Scenes 2 + 3 — narrative statements.
 *
 * Two 100vh sections inside the fixed overlay.
 * Each statement fades in when scrolled into view (IntersectionObserver
 * scoped to the overlay container, not the viewport).
 *
 * No scroll hijacking. No timers. Pure IO.
 */
export function IntroStatementScene({
  statement1,
  statement2,
  reducedMotion,
  containerRef,
}: IntroStatementSceneProps) {
  const [s1Visible, setS1Visible] = useState(reducedMotion);
  const [s2Visible, setS2Visible] = useState(reducedMotion);

  const s1Ref = useRef<HTMLElement>(null);
  const s2Ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const root = containerRef?.current ?? null;

    const observe = (
      el: Element | null,
      cb: () => void,
    ) => {
      if (!el) return () => {};
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { cb(); observer.disconnect(); } },
        { root, threshold: 0.35 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    };

    const cleanup1 = observe(s1Ref.current, () => setS1Visible(true));
    const cleanup2 = observe(s2Ref.current, () => setS2Visible(true));

    return () => { cleanup1(); cleanup2(); };
  }, [reducedMotion, containerRef]);

  const reveal = (visible: boolean, delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: reducedMotion
      ? 'none'
      : `opacity 750ms ${delay}ms cubic-bezier(0.4,0,0.2,1), transform 750ms ${delay}ms cubic-bezier(0.4,0,0.2,1)`,
  });

  return (
    <div style={{ width: '100%' }}>

      {/* ── Scene 2: Statement 1 ─── */}
      <section
        ref={s1Ref}
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(32px, 6vw, 80px) clamp(24px, 6vw, 96px)',
          backgroundColor: '#fafaf9',
          position: 'relative',
        }}
      >
        <p
          style={{
            ...reveal(s1Visible),
            fontSize: 'clamp(26px, 4.2vw, 68px)',
            lineHeight: 1.08,
            letterSpacing: '-0.022em',
            fontWeight: 500,
            color: '#1c1917',
            maxWidth: '14ch',
            textAlign: 'center',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {statement1}
        </p>

        {/* Scroll hint */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 'clamp(28px, 5vh, 48px)',
            left: 0, right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: s1Visible ? 0.25 : 0,
            transition: reducedMotion ? 'none' : 'opacity 700ms 600ms ease',
            color: '#1c1917',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'ph-arrow-bob 2.4s ease-in-out infinite' }}
            aria-hidden="true"
          >
            <polyline points="4 7 9 13 14 7" />
          </svg>
        </div>
      </section>

      {/* ── Scene 3: Statement 2 ─── */}
      <section
        ref={s2Ref}
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(32px, 6vw, 80px) clamp(24px, 6vw, 96px)',
          backgroundColor: '#fafaf9',
        }}
      >
        <p
          style={{
            ...reveal(s2Visible),
            fontSize: 'clamp(26px, 4.2vw, 68px)',
            lineHeight: 1.08,
            letterSpacing: '-0.022em',
            fontWeight: 500,
            color: '#1c1917',
            maxWidth: '20ch',
            textAlign: 'center',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {/* First part full opacity; "behind the solution." dimmed */}
          <span>{statement2.split('behind')[0]}</span>
          {statement2.includes('behind') && (
            <span style={{ opacity: 0.4 }}>{'behind' + statement2.split('behind')[1]}</span>
          )}
        </p>
      </section>
    </div>
  );
}
