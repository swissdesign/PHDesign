import React, { useEffect, useRef, useState } from 'react';

interface IntroStatementSceneProps {
  /** "Design is not the solution." */
  statement1: string;
  /** "Design is the work behind the solution." */
  statement2: string;
  reducedMotion: boolean;
}

/**
 * Scene 2 + 3.
 *
 * Layout:
 *   - 100vh: statement 1 centred, with a scroll-hint arrow below
 *   - 100vh: statement 2 centred, revealed by IntersectionObserver
 *
 * No scroll hijacking. No sticky positioning traps. Pure document flow.
 */
export function IntroStatementScene({
  statement1,
  statement2,
  reducedMotion,
}: IntroStatementSceneProps) {
  const [s1Visible, setS1Visible] = useState(false);
  const [s2Visible, setS2Visible] = useState(false);

  const s1Ref = useRef<HTMLDivElement>(null);
  const s2Ref = useRef<HTMLDivElement>(null);

  // Animate statement 1 in shortly after mount
  useEffect(() => {
    if (reducedMotion) {
      setS1Visible(true);
      setS2Visible(true);
      return;
    }
    const t = setTimeout(() => setS1Visible(true), 40);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  // Statement 2 — IntersectionObserver
  useEffect(() => {
    if (reducedMotion || !s2Ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setS2Visible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(s2Ref.current);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const revealStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: reducedMotion
      ? 'none'
      : `opacity 800ms ${delay}ms cubic-bezier(0.4,0,0.2,1), transform 800ms ${delay}ms cubic-bezier(0.4,0,0.2,1)`,
  });

  return (
    <div style={{ width: '100%', backgroundColor: '#fafaf9' }}>

      {/* ── Scene 2: Statement 1 ─────────────────────────── */}
      <section
        ref={s1Ref}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(32px, 8vw, 96px) clamp(24px, 6vw, 96px)',
          position: 'relative',
        }}
      >
        <p
          aria-label={statement1}
          style={{
            ...revealStyle(s1Visible),
            fontSize: 'clamp(28px, 4.5vw, 72px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
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

        {/* Scroll hint — fades in after statement 1, centred at bottom */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 'clamp(32px, 6vh, 56px)',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            // Reveal via opacity + translateY only (no left/transform conflict)
            opacity: s1Visible ? 0.3 : 0,
            transform: s1Visible ? 'translateY(0)' : 'translateY(20px)',
            transition: reducedMotion
              ? 'none'
              : 'opacity 800ms 600ms cubic-bezier(0.4,0,0.2,1), transform 800ms 600ms cubic-bezier(0.4,0,0.2,1)',
            color: '#1c1917',
          }}
        >
          <ScrollArrow reducedMotion={reducedMotion} />
        </div>
      </section>

      {/* ── Scene 3: Statement 2 ─────────────────────────── */}
      <section
        ref={s2Ref}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(32px, 8vw, 96px) clamp(24px, 6vw, 96px)',
        }}
      >
        <p
          aria-label={statement2}
          style={{
            ...revealStyle(s2Visible),
            fontSize: 'clamp(28px, 4.5vw, 72px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontWeight: 500,
            color: '#1c1917',
            maxWidth: '18ch',
            textAlign: 'center',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {/* "Design is the work" uses full opacity; "behind the solution." slightly dimmer */}
          <span>{statement2.split('behind')[0]}</span>
          {statement2.includes('behind') && (
            <span style={{ opacity: 0.45 }}>{'behind' + statement2.split('behind')[1]}</span>
          )}
        </p>
      </section>
    </div>
  );
}

// ─── Scroll Arrow ─────────────────────────────────────────────────────────────
// Subtle animated downward chevron. No text.
function ScrollArrow({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <style>{`
        @keyframes ph-arrow-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: reducedMotion ? 'none' : 'ph-arrow-bob 2s ease-in-out infinite',
          color: 'inherit',
        }}
        aria-hidden="true"
      >
        <polyline points="4 8 10 14 16 8" />
      </svg>
    </>
  );
}
