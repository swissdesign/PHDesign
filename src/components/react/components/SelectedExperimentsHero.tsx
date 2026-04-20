import React, { useEffect, useRef, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';

interface SelectedExperimentsHeroProps {
  items: HeroExperimentRow[];
  lang: string;
  reducedMotion: boolean;
  sectionLabel: string;
  /** The fixed scrollable overlay — used as IO root for scroll-triggered reveals */
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Scene 4 — Selected Experiments.
 *
 * Editorial hero-style carousel.
 * - IntersectionObserver scoped to overlay container
 * - Keyboard + touch swipe navigation
 * - Dot indicators
 * - Staggered card reveal on each slide change
 */
export function SelectedExperimentsHero({
  items,
  lang,
  reducedMotion,
  sectionLabel,
  containerRef,
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
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionVisible, setSectionVisible] = useState(reducedMotion);
  const [cardVisible, setCardVisible] = useState(reducedMotion);

  const headerRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const total = clientItems.length;

  const goTo = (index: number) => setActiveIndex((index + total) % total);
  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

  // Section header reveal via IO scoped to overlay
  useEffect(() => {
    if (reducedMotion || !headerRef.current) return;
    const root = containerRef?.current ?? null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          setTimeout(() => setCardVisible(true), 280);
          observer.disconnect();
        }
      },
      { root, threshold: 0.15 }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [reducedMotion, containerRef]);

  // Re-stagger card on slide change
  useEffect(() => {
    if (!sectionVisible || reducedMotion) return;
    setCardVisible(false);
    const t = setTimeout(() => setCardVisible(true), 60);
    return () => clearTimeout(t);
  }, [activeIndex, sectionVisible, reducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex]);

  const headerReveal: React.CSSProperties = {
    opacity: sectionVisible ? 1 : 0,
    transform: sectionVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: reducedMotion ? 'none' : 'opacity 700ms cubic-bezier(0.4,0,0.2,1), transform 700ms cubic-bezier(0.4,0,0.2,1)',
  };

  const cardReveal = (delay = 0): React.CSSProperties => ({
    opacity: cardVisible ? 1 : 0,
    transform: cardVisible ? 'translateY(0)' : 'translateY(18px)',
    transition: reducedMotion
      ? 'none'
      : `opacity 550ms ${delay}ms cubic-bezier(0.4,0,0.2,1), transform 550ms ${delay}ms cubic-bezier(0.4,0,0.2,1)`,
  });

  const activeItem = clientItems[activeIndex];

  return (
    <section
      ref={headerRef}
      style={{
        width: '100%',
        backgroundColor: '#fafaf9',
        borderTop: '1px solid rgba(28,25,23,0.07)',
        padding: 'clamp(56px, 9vh, 104px) clamp(24px, 6vw, 96px) clamp(72px, 11vh, 120px)',
      }}
      aria-label={sectionLabel}
    >
      {/* Header row */}
      <div
        style={{
          ...headerReveal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 'clamp(40px, 7vh, 72px)',
        }}
      >
        <h2 style={{
          fontSize: 'clamp(9px, 0.9vw, 11px)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: '#1c1917',
          opacity: 0.38,
          margin: 0,
          fontFamily: 'inherit',
        }}>
          {sectionLabel}
        </h2>

        {hasItems && total > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={prev} aria-label="Previous experiment" style={navBtn}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, navBtnActive)}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, navBtn)}>
              <ChevronLeft />
            </button>
            <span style={{ fontSize: 11, letterSpacing: '0.18em', color: '#1c1917', opacity: 0.28, fontFamily: 'inherit' }}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <button onClick={next} aria-label="Next experiment" style={navBtn}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, navBtnActive)}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, navBtn)}>
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Card */}
      {hasItems && activeItem && (
        <div
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 48) delta < 0 ? next() : prev();
            touchStartX.current = null;
          }}
        >
          {/* Keyword tag */}
          <div style={{ marginBottom: 'clamp(16px, 2.5vh, 28px)' }}>
            <span style={{
              ...cardReveal(0),
              display: 'inline-block',
              fontSize: 'clamp(9px, 0.9vw, 11px)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: activeItem.accent,
              fontWeight: 500,
              fontFamily: 'inherit',
            }}>
              {activeItem.keyword}
            </span>
          </div>

          {/* Large title */}
          <div style={{
            paddingBottom: 'clamp(20px, 3.5vh, 40px)',
            borderBottom: '1px solid rgba(28,25,23,0.07)',
            marginBottom: 'clamp(20px, 3.5vh, 40px)',
          }}>
            <h3 style={{
              ...cardReveal(70),
              fontSize: 'clamp(30px, 5.2vw, 84px)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              fontWeight: 500,
              color: '#1c1917',
              margin: 0,
              fontFamily: 'inherit',
            }}>
              {activeItem.title}
            </h3>
          </div>

          {/* Result + CTA */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 'clamp(20px, 3vw, 40px)',
          }}>
            <div style={{ ...cardReveal(140), flex: '1 1 280px' }}>
              <p style={{
                fontSize: 'clamp(14px, 1.3vw, 19px)',
                lineHeight: 1.65,
                color: '#1c1917',
                opacity: 0.5,
                margin: 0,
                fontWeight: 400,
                fontFamily: 'inherit',
                maxWidth: '52ch',
              }}>
                {activeItem.result}
              </p>
            </div>

            {activeItem.ctaHref && (
              <div style={{ ...cardReveal(210), flexShrink: 0 }}>
                <a
                  href={activeItem.ctaHref}
                  style={ctaLink}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#3a3630')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1c1917')}
                >
                  {activeItem.ctaLabel || (isEn ? 'View experiment' : 'Experiment ansehen')}
                  <ArrowDiagonal />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dot indicators */}
      {hasItems && total > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8,
          marginTop: 'clamp(36px, 6vh, 56px)',
        }} aria-hidden="true">
          {clientItems.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Experiment ${i + 1}`}
              style={{
                width: i === activeIndex ? 22 : 6, height: 6, borderRadius: 3,
                backgroundColor: '#1c1917',
                opacity: i === activeIndex ? 0.65 : 0.18,
                border: 'none', cursor: 'pointer', padding: 0,
                transition: reducedMotion ? 'none' : 'all 280ms cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const navBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: '50%',
  border: '1px solid rgba(28,25,23,0.14)',
  backgroundColor: 'transparent', color: '#1c1917',
  cursor: 'pointer', padding: 0, transition: 'all 180ms ease',
};
const navBtnActive: React.CSSProperties = {
  ...navBtn, backgroundColor: '#1c1917', borderColor: '#1c1917', color: '#fafaf9',
};
const ctaLink: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 9,
  fontSize: 'clamp(9px, 0.9vw, 11px)', letterSpacing: '0.2em',
  textTransform: 'uppercase', fontWeight: 500,
  color: '#fafaf9', backgroundColor: '#1c1917',
  padding: '13px 26px', textDecoration: 'none',
  transition: 'background-color 180ms ease', fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

// ─── Micro icons ──────────────────────────────────────────────────────────────
function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <polyline points="9 3 5 7 9 11" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <polyline points="5 3 9 7 5 11" />
    </svg>
  );
}
function ArrowDiagonal() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="2" y1="9" x2="9" y2="2" />
      <polyline points="4 2 9 2 9 7" />
    </svg>
  );
}
