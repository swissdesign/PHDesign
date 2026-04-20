/**
 * HeroExperimentsReact — Homepage Intro
 *
 * Replaces the old "DARE ANY WAY" narrative with a 4-scene cinematic intro.
 * All scenes live in document flow — no scroll hijacking, no click-to-reveal.
 *
 * Scene 1  IntroLogoScene     Full-screen logo + "design studio." (auto-exits)
 * Scene 2  IntroStatementScene  "Design is not the solution." (fades in after logo)
 * Scene 3  IntroStatementScene  "Design is the work behind the solution." (scroll reveal)
 * Scene 4  SelectedExperimentsHero  Editorial curated experiments
 */

import React, { useEffect, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';
import { IntroLogoScene } from './IntroLogoScene';
import { IntroStatementScene } from './IntroStatementScene';
import { SelectedExperimentsHero } from './SelectedExperimentsHero';

// ─── Editable copy constants ────────────────────────────────────────────────
// Change these without touching component logic.
const COPY = {
  studio:           'design studio.',
  statement1:       'Design is not the solution.',
  statement2:       'Design is the work behind the solution.',
  experimentsLabel: 'Selected Experiments',
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface HeroExperimentsReactProps {
  items: HeroExperimentRow[];
  lang?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function HeroExperimentsReact({ items = [], lang = 'de' }: HeroExperimentsReactProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Whether Scene 1 (logo) has exited — Scene 2 becomes visible when true.
  // In reduced-motion mode the logo scene skips its exit timer and we reveal
  // the statements immediately via a different render path.
  const [logoExited, setLogoExited] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // In reduced motion: skip the logo overlay entirely, show everything statically
  const showLogoOverlay = !reducedMotion;
  const showStatements = reducedMotion || logoExited;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#fafaf9',
      }}
    >
      {/* ── Scene 1: Logo overlay (fixed, auto-exits) ─────────────────── */}
      {showLogoOverlay && (
        <IntroLogoScene
          studioLabel={COPY.studio}
          reducedMotion={reducedMotion}
          onExited={() => setLogoExited(true)}
        />
      )}

      {/* ── Scene 1 (reduced motion): inline logo, no overlay ─────────── */}
      {reducedMotion && (
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 'clamp(48px, 10vh, 96px) clamp(24px, 6vw, 96px)',
            borderBottom: '1px solid rgba(28,25,23,0.06)',
          }}
        >
          <div style={{ width: 'clamp(64px, 14vw, 160px)', color: '#1c1917' }}>
            {/* TODO: replace with inline SVG if /public/ph-logo.svg is unavailable */}
            <img
              src="/ph-logo.svg"
              alt="PH — Pascal Heiniger"
              width={252}
              height={235}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <p style={{
            marginTop: 'clamp(12px, 2vw, 24px)',
            fontSize: 'clamp(10px, 1.2vw, 13px)',
            letterSpacing: '0.22em',
            textTransform: 'lowercase',
            color: '#1c1917',
            opacity: 0.5,
            fontWeight: 400,
            fontFamily: 'inherit',
          }}>
            {COPY.studio}
          </p>
        </section>
      )}

      {/* ── Spacer so scrollable content starts below the full-height logo overlay ── */}
      {showLogoOverlay && (
        <div
          aria-hidden="true"
          style={{
            // This spacer holds the page height so the fixed overlay doesn't
            // collapse the document. It's invisible — the overlay sits on top.
            minHeight: '100vh',
            pointerEvents: 'none',
            // Once logo exits, shrink spacer away so statements flow in
            height: logoExited ? 0 : '100vh',
            overflow: 'hidden',
            transition: reducedMotion ? 'none' : 'height 400ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}

      {/* ── Scenes 2 + 3: Narrative statements ────────────────────────── */}
      {showStatements && (
        <IntroStatementScene
          statement1={COPY.statement1}
          statement2={COPY.statement2}
          reducedMotion={reducedMotion}
        />
      )}

      {/* ── Scene 4: Selected Experiments ─────────────────────────────── */}
      {showStatements && (
        <SelectedExperimentsHero
          items={items}
          lang={lang}
          reducedMotion={reducedMotion}
          sectionLabel={COPY.experimentsLabel}
        />
      )}
    </div>
  );
}
