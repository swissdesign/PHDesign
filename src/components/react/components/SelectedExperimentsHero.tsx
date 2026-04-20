import React, { useEffect, useRef, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';

interface SelectedExperimentsHeroProps {
  items: HeroExperimentRow[];
  lang: string;
  reducedMotion: boolean;
  /** "Selected Experiments" label copy */
  sectionLabel: string;
}

/**
 * Scene 4 — Selected Experiments.
 *
 * Editorial hero-style carousel.
 * - Full-width typographic card layout
 * - Keyboard + pointer navigation
 * - Touch swipe on mobile (no library)
 * - Progress dots
 * - Each card reveals with stagger on first enter (IntersectionObserver)
 * - CTA link preserved from item.ctaHref
 */
export function SelectedExperimentsHero({
  items,
  lang,
  reducedMotion,
  sectionLabel,
}: SelectedExperimentsHeroProps) {
  const isEn = lang === 'en';
  const hasItems = items.length > 0;

  const clientItems = items.map((item) => ({
    keyword: item.keyword,
    title: item.experiment_title,
    result: isEn ? item.result_en : item.result_de,
    ctaLabel: isEn ? item.cta_label_en : item.cta_label_de,
    ctaHref: item.cta_href,
    accent: item.accent || '#1c1917',
    question: isEn ? item.question_en : item.question_de,
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = clientItems.length;

  const goTo = (index: number) => setActiveIndex((index + total) % total);
  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

  // Header intersection reveal
  useEffect(() => {
    if (!headerRef.current) return;
    if (reducedMotion) {
      setHeaderVisible(true);
      setCardVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          // Small delay so card content stagger feels intentional
          setTimeout(() => setCardVisible(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Reset card visible state on slide change so stagger re-triggers
  useEffect(() => {
    if (!headerVisible) return;
    setCardVisible(false);
    const t = setTimeout(() => setCardVisible(true), 60);
    return () => clearTimeout(t);
  }, [activeIndex, headerVisible]);

  // Keyboard accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex]);

  const reveal = (delay = 0): React.CSSProperties => ({
    opacity: cardVisible ? 1 : 0,
    transform: cardVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: reducedMotion
      ? 'none'
      : `opacity 600ms ${delay}ms cubic-bezier(0.4,0,0.2,1), transform 600ms ${delay}ms cubic-bezier(0.4,0,0.2,1)`,
  });

  const headerReveal: React.CSSProperties = {
    opacity: headerVisible ? 1 : 0,
    transform: headerVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: reducedMotion ? 'none' : 'opacity 700ms cubic-bezier(0.4,0,0.2,1), transform 700ms cubic-bezier(0.4,0,0.2,1)',
  };

  const activeItem = clientItems[activeIndex];

  return (
    <section
      style={{
        width: '100%',
        backgroundColor: '#fafaf9',
        borderTop: '1px solid rgba(28,25,23,0.08)',
        padding: 'clamp(64px, 10vh, 120px) clamp(24px, 6vw, 96px)',
      }}
      aria-label={sectionLabel}
    >
      {/* Section header */}
      <div
        ref={headerRef}
        style={{
          ...headerReveal,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: 'clamp(48px, 8vh, 80px)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(10px, 1vw, 12px)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: '#1c1917',
            opacity: 0.4,
            margin: 0,
            fontFamily: 'inherit',
          }}
        >
          {sectionLabel}
        </h2>

        {/* Navigation controls — desktop */}
        {hasItems && total > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button
              onClick={prev}
              aria-label="Previous experiment"
              style={navBtnStyle}
              onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, navBtnHover)}
              onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, navBtnStyle)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="10 4 6 8 10 12" />
              </svg>
            </button>

            <span style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: '#1c1917',
              opacity: 0.3,
              fontFamily: 'inherit',
            }}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>

            <button
              onClick={next}
              aria-label="Next experiment"
              style={navBtnStyle}
              onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, navBtnHover)}
              onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, navBtnStyle)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="6 4 10 8 6 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Card content */}
      {hasItems && activeItem && (
        <div
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 48) delta < 0 ? next() : prev();
            touchStartX.current = null;
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'clamp(32px, 4vw, 64px)',
            alignItems: 'start',
          }}
        >
          {/* Left: keyword + number */}
          <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <span
              style={{
                ...reveal(0),
                display: 'inline-block',
                fontSize: 'clamp(10px, 1vw, 12px)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: activeItem.accent,
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              {activeItem.keyword}
            </span>
          </div>

          {/* Centre: large title */}
          <div
            style={{
              gridColumn: 'span 12',
              paddingBottom: 'clamp(24px, 4vh, 48px)',
              borderBottom: '1px solid rgba(28,25,23,0.08)',
            }}
          >
            <h3
              style={{
                ...reveal(80),
                fontSize: 'clamp(32px, 5.5vw, 88px)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                fontWeight: 500,
                color: '#1c1917',
                margin: 0,
                fontFamily: 'inherit',
              }}
            >
              {activeItem.title}
            </h3>
          </div>

          {/* Bottom: result + CTA */}
          <div
            style={{
              gridColumn: 'span 12',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(24px, 3vw, 48px)',
              alignItems: 'end',
            }}
          >
            {/* Result text — wrapped so reveal opacity and text opacity don't conflict */}
            <div style={reveal(160)}>
              <p
                style={{
                  fontSize: 'clamp(15px, 1.4vw, 20px)',
                  lineHeight: 1.6,
                  color: '#1c1917',
                  opacity: 0.5,
                  margin: 0,
                  fontWeight: 400,
                  fontFamily: 'inherit',
                  maxWidth: '52ch',
                }}
              >
                {activeItem.result}
              </p>
            </div>

            {activeItem.ctaHref && (
              <div style={{ ...reveal(240), display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={activeItem.ctaHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 'clamp(10px, 1vw, 12px)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: '#fafaf9',
                    backgroundColor: '#1c1917',
                    padding: '14px 28px',
                    textDecoration: 'none',
                    transition: 'background-color 200ms ease',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#3a3630')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1c1917')}
                >
                  {activeItem.ctaLabel || (isEn ? 'View experiment' : 'Experiment ansehen')}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="2" y1="10" x2="10" y2="2" />
                    <polyline points="4 2 10 2 10 8" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dot indicators — mobile/compact */}
      {hasItems && total > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 'clamp(40px, 6vh, 64px)',
          }}
          aria-hidden="true"
        >
          {clientItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to experiment ${i + 1}`}
              style={{
                width: i === activeIndex ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#1c1917',
                opacity: i === activeIndex ? 0.7 : 0.2,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: reducedMotion ? 'none' : 'all 300ms cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Inline style constants ───────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  border: '1px solid rgba(28,25,23,0.15)',
  backgroundColor: 'transparent',
  color: '#1c1917',
  cursor: 'pointer',
  borderRadius: '50%',
  transition: 'all 200ms ease',
  padding: 0,
};

const navBtnHover: React.CSSProperties = {
  ...navBtnStyle,
  backgroundColor: '#1c1917',
  borderColor: '#1c1917',
  color: '#fafaf9',
};
