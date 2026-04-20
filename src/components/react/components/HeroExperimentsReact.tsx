/**
 * HeroExperimentsReact — Homepage Intro
 *
 * Architecture: single position:fixed fullscreen overlay with its own
 * internal scroll. The App (#app-mount) is hidden until the user scrolls
 * through the entire intro and hits the sentinel at the bottom.
 *
 * No spacer tricks. No timed overlay exit. No jump.
 *
 * Scene 1  — Logo + "design studio."           (100vh, fade-in on mount)
 * Scene 2  — "Design is not the solution."     (100vh, IntersectionObserver inside overlay)
 * Scene 3  — "Design is the work behind..."    (100vh, IntersectionObserver inside overlay)
 * Scene 4  — Selected Experiments              (full height, IntersectionObserver inside overlay)
 * Sentinel — at bottom → lifts overlay, reveals App
 */

import React, { useEffect, useRef, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';
import { IntroLogoScene } from './IntroLogoScene';
import { IntroStatementScene } from './IntroStatementScene';
import { SelectedExperimentsHero } from './SelectedExperimentsHero';

// ─── Editable copy constants ─────────────────────────────────────────────────
const COPY = {
  studio:           'design studio.',
  statement1:       'Design is not the solution.',
  statement2:       'Design is the work behind the solution.',
  experimentsLabel: 'Selected Experiments',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface HeroExperimentsReactProps {
  items: HeroExperimentRow[];
  lang?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HeroExperimentsReact({ items = [], lang = 'de' }: HeroExperimentsReactProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // overlayVisible: true until user scrolls to sentinel at bottom of intro
  const [overlayVisible, setOverlayVisible] = useState(true);
  // overlayGone: true after fade-out transition completes (removes from DOM)
  const [overlayGone, setOverlayGone] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Hide #app-mount while overlay is showing
  useEffect(() => {
    const appMount = document.getElementById('app-mount');
    if (appMount) {
      appMount.style.visibility = 'hidden';
      appMount.style.opacity = '0';
    }
  }, []);

  // Sentinel — when scrolled into view inside overlay, lift overlay + reveal App
  useEffect(() => {
    const overlay = overlayRef.current;
    const sentinel = sentinelRef.current;
    if (!overlay || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 1. Fade overlay out
          setOverlayVisible(false);

          // 2. Reveal App below with matching fade
          const appMount = document.getElementById('app-mount');
          if (appMount) {
            appMount.style.transition = 'opacity 700ms ease, visibility 700ms ease';
            appMount.style.visibility = 'visible';
            appMount.style.opacity = '1';
          }

          // 3. Remove overlay from DOM after transition
          const removeTimer = setTimeout(() => {
            setOverlayGone(true);
            // Ensure body scroll is fully restored
            document.body.style.overflow = '';
          }, reducedMotion ? 0 : 800);

          observer.disconnect();
          return () => clearTimeout(removeTimer);
        }
      },
      {
        root: overlay,        // observe relative to the overlay's scroll
        threshold: 0.5,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Reduced motion: skip overlay entirely, show everything in normal flow
  if (reducedMotion) {
    return <ReducedMotionFallback items={items} lang={lang} />;
  }

  // Overlay has faded and been removed — nothing to render
  if (overlayGone) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        overflowY: 'scroll',
        overflowX: 'hidden',
        backgroundColor: '#fafaf9',
        // Fade out when sentinel is hit
        opacity: overlayVisible ? 1 : 0,
        transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1)',
        // Prevent interaction once fading out
        pointerEvents: overlayVisible ? 'auto' : 'none',
        // iOS momentum scroll
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}
    >
      {/* ── Scene 1: Logo ───────────────────────────────────── */}
      <IntroLogoScene
        studioLabel={COPY.studio}
        reducedMotion={false}
      />

      {/* ── Scenes 2 + 3: Statements ────────────────────────── */}
      <IntroStatementScene
        statement1={COPY.statement1}
        statement2={COPY.statement2}
        reducedMotion={false}
        containerRef={overlayRef}
      />

      {/* ── Scene 4: Experiments ────────────────────────────── */}
      <SelectedExperimentsHero
        items={items}
        lang={lang}
        reducedMotion={false}
        sectionLabel={COPY.experimentsLabel}
        containerRef={overlayRef}
      />

      {/* ── Sentinel: triggers App reveal ───────────────────── */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          height: 1,
          width: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── Reduced motion fallback ──────────────────────────────────────────────────
// All content rendered statically in normal document flow.
// #app-mount is NOT hidden — everything is immediately accessible.
function ReducedMotionFallback({ items, lang }: { items: HeroExperimentRow[]; lang: string }) {
  const isEn = lang === 'en';

  // Ensure #app-mount is visible
  useEffect(() => {
    const appMount = document.getElementById('app-mount');
    if (appMount) {
      appMount.style.visibility = 'visible';
      appMount.style.opacity = '1';
    }
  }, []);

  return (
    <div style={{ width: '100%', backgroundColor: '#fafaf9' }}>
      {/* Logo + studio */}
      <section style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '50vh',
        padding: 'clamp(48px, 8vh, 80px) clamp(24px, 6vw, 96px)',
        borderBottom: '1px solid rgba(28,25,23,0.06)',
      }}>
        <div style={{ width: 'clamp(64px, 12vw, 140px)', color: '#1c1917' }}>
          <img src="/ph-logo.svg" alt="PH" width={252} height={235}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <p style={{
          marginTop: 16, fontSize: 'clamp(10px, 1.2vw, 13px)',
          letterSpacing: '0.22em', textTransform: 'lowercase',
          color: '#1c1917', opacity: 0.5, fontWeight: 400, fontFamily: 'inherit',
        }}>
          {COPY.studio}
        </p>
      </section>

      {/* Statements */}
      <section style={{
        display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 5vh, 56px)',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(48px, 8vh, 80px) clamp(24px, 6vw, 96px)',
        borderBottom: '1px solid rgba(28,25,23,0.06)',
      }}>
        <p style={{
          fontSize: 'clamp(24px, 4vw, 60px)', lineHeight: 1.1,
          letterSpacing: '-0.02em', fontWeight: 500, color: '#1c1917',
          maxWidth: '16ch', textAlign: 'center', margin: 0, fontFamily: 'inherit',
        }}>
          {COPY.statement1}
        </p>
        <p style={{
          fontSize: 'clamp(24px, 4vw, 60px)', lineHeight: 1.1,
          letterSpacing: '-0.02em', fontWeight: 500, color: '#1c1917',
          maxWidth: '20ch', textAlign: 'center', margin: 0, fontFamily: 'inherit',
          opacity: 0.6,
        }}>
          {COPY.statement2}
        </p>
      </section>

      {/* Experiments */}
      <SelectedExperimentsHero
        items={items} lang={lang} reducedMotion={true}
        sectionLabel={COPY.experimentsLabel}
      />
    </div>
  );
}
