import React, { useEffect, useRef, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';

export interface HeroExperimentsReactProps {
    items: HeroExperimentRow[];
    lang?: string;
}

const SUPPORT_LINE_EN = "Curiosity over doubt.";
const SUPPORT_LINE_DE = "Neugier statt Zweifel.";

// Map the items down slightly so they are safe to pass to React without huge payloads
export default function HeroExperimentsReact({ items = [], lang = 'de' }: HeroExperimentsReactProps) {
    const isEn = lang === 'en';
    const supportLine = isEn ? SUPPORT_LINE_EN : SUPPORT_LINE_DE;

    const wrapperRef = useRef<HTMLDivElement>(null);

    // States mapped natively from scroll progress
    const [progress, setProgress] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(false);

    // Fallback checking
    const hasItems = items.length > 0;

    // Transform items for the specific view
    const clientItems = items.map(item => ({
        keyword: item.keyword,
        enemy: item.enemy,
        rallying_cry: item.rallying_cry,
        question: isEn ? item.question_en : item.question_de,
        doubt: isEn ? item.doubt_en : item.doubt_de,
        title: item.experiment_title,
        result: isEn ? item.result_en : item.result_de,
        ctaLabel: isEn ? item.cta_label_en : item.cta_label_de,
        ctaHref: item.cta_href,
        accent: item.accent || '#1c1917'
    }));

    // Setup Observer & Scroll Listener
    useEffect(() => {
        // Check for reduced motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);

        const onMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', onMediaChange);

        if (mediaQuery.matches) return;

        let ticking = false;

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScroll);
                ticking = true;
            }
        };

        const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

        const updateScroll = () => {
            if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                // 0 = top of wrapper at top of screen
                // 1 = bottom of wrapper at bottom of screen
                const scrollableDistance = rect.height - viewportHeight;
                if (scrollableDistance > 0) {
                    const rawProgress = -rect.top / scrollableDistance;
                    setProgress(clamp(rawProgress, 0, 1));
                }
            }
            ticking = false;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        // Inital check
        updateScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            mediaQuery.removeEventListener('change', onMediaChange);
        };
    }, []);

    // --- MANUAL CAROUSEL STATE ---
    const [activeIndex, setActiveIndex] = useState(0);

    const nextSlide = () => setActiveIndex(i => (i + 1) % clientItems.length);
    const prevSlide = () => setActiveIndex(i => (i - 1 + clientItems.length) % clientItems.length);

    // --- MATH FOR RENDER ---
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    // Phase 1: 0.0 -> 0.2 (Shrink and move DARE ANY WAY, fade out hint & support text)
    const p1Progress = clamp(progress / 0.2, 0, 1);

    // Title transformations
    const hintOpacity = 1 - p1Progress;
    const supportOpacity = 1 - (p1Progress * 2); // Fades completely by half of p1

    // Ease In/Out for scale so it feels smoother
    const easeInOut = (t: number) => (Math.sin((t - 0.5) * Math.PI) + 1) * 0.5;
    const titleScale = lerp(1, 0.45, easeInOut(p1Progress));

    // Translation 
    // We approximate width based on a standard 1440 grid. We want it pushed to the left.
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    // At scale 0.45, moving to origin top-left anchor.
    const titleMoveX = isMobile ? lerp(0, -35, p1Progress) : lerp(0, -30, p1Progress); // Use VW to scale responsively
    const titleMoveY = isMobile ? lerp(0, -35, p1Progress) : lerp(0, -25, p1Progress); // Use VH

    // Anchor fades slightly when active as a background element
    // But wait! User request: "keep the anchor present into the first experiment reveal"
    // If progress goes > 0.95 (wrapping up the 400vh), we might want to ensure it connects cleanly.
    // Actually, because it is `sticky h-[100vh]` inside a `relative h-[400vh]`, it will naturally scroll up with the document AT THE END of the 400vh.
    // So it literally pulls up naturally into the sky before the Experiments section hits. To persist it "into" the first experiment, we need it to span further or we just accept the natural sticky scroll-away. For now, natural scroll-away is standard. If they want overlap, we'd pull it out of the container. 

    const titleOpacity = lerp(1, 0.2, p1Progress);

    // Phase 2: 0.2 -> 1.0 (Principles)
    const p2Progress = clamp((progress - 0.2) / 0.8, 0, 1);
    const cards = [
        { title: "Courage", desc: "Move before certainty shows up." },
        { title: "Curiosity", desc: "Ask what others leave alone." },
        { title: "Experiment", desc: "Test the better idea." },
        { title: "Proof", desc: "Keep what actually works." }
    ];

    // Map each card to a slice of the 0-1 p2Progress
    const chunkCount = cards.length;
    const chunkSize = 1 / chunkCount;

    // Reduced Motion Override
    if (reducedMotion) {
        return (
            <div className="relative w-full bg-[#FAFAF9] text-stone-900 border-b border-stone-200">
                <section className="relative w-full py-32 px-6 md:px-12 xl:px-24 flex flex-col justify-center overflow-hidden">
                    <div className="max-w-[1400px] mx-auto w-full relative z-20">
                        <h1 className="text-[14vw] leading-[0.85] md:text-[8vw] lg:text-[7.5vw] font-medium tracking-tighter uppercase mb-6 text-stone-900 select-none">
                            <span className="block">DARE</span>
                            <span className="block">ANY</span>
                            <span className="block text-stone-400">WAY</span>
                        </h1>
                        <p className="text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-stone-500 max-w-md">
                            {supportLine}
                        </p>
                    </div>
                </section>

                <section className="relative w-full px-6 md:px-12 xl:px-24 py-16 bg-[#FAFAF9]">
                    <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row relative items-start gap-16 lg:gap-8">
                        <div className="lg:w-8/12 xl:w-7/12 w-full lg:ml-auto flex flex-col gap-24">
                            {cards.map((c, i) => (
                                <div key={i} className="mb-8">
                                    <h3 className="text-xs md:text-sm uppercase tracking-widest text-stone-500 mb-3 font-semibold">{c.title}</h3>
                                    <p className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight leading-snug text-stone-900 max-w-xl">
                                        {c.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/** Render Experiments Section... omitted for brevity because reduced motion isn't the main focus, just needs to mount safely */}
                {hasItems && (
                    <StaticExperiments items={clientItems} activeIndex={activeIndex} nextSlide={nextSlide} prevSlide={prevSlide} />
                )}
            </div>
        );
    }

    // STANDARD MOTION RENDER
    return (
        <div className="relative w-full bg-[#FAFAF9] text-stone-900 border-b border-stone-200">

            {/* 400vh Scroll Wrapper */}
            <div ref={wrapperRef} className="relative w-full h-[500vh]">

                {/* Sticky Viewport Container */}
                <div className="sticky top-0 w-full h-[100vh] overflow-hidden flex items-center justify-center pointer-events-none">

                    {/* Subtle grid/dot background for "tech/studio" feel */}
                    <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                    {/* Dynamic Title Container */}
                    <div
                        className={`absolute flex flex-col transform-origin-center will-change-transform ${p1Progress >= 0.5 ? 'items-start text-left' : 'items-center text-center'}`}
                        style={{
                            transform: `translate3d(${titleMoveX}vw, ${titleMoveY}vh, 0) scale(${titleScale})`,
                            opacity: titleOpacity
                        }}
                    >
                        <h1 className="text-[14vw] leading-[0.85] md:text-[10vw] font-medium tracking-tighter uppercase mb-6 sm:mb-8 text-stone-900 select-none">
                            <span className="block text-stone-900">DARE</span>
                            <span className="block text-stone-900">ANY</span>
                            <span className="block text-stone-400">WAY</span>
                        </h1>
                        <div className="text-xl md:text-3xl font-light tracking-tight text-stone-500 will-change-opacity overflow-hidden"
                            style={{ opacity: clamp(supportOpacity, 0, 1), height: p1Progress > 0.5 ? 0 : 'auto' }}>
                            {supportLine}
                        </div>
                    </div>

                    {/* Scroll Hint */}
                    <div
                        className="absolute bottom-12 text-stone-400 text-[10px] sm:text-xs tracking-widest uppercase font-semibold z-20 select-none will-change-opacity"
                        style={{ opacity: clamp(hintOpacity, 0, 1) }}
                    >
                        Scroll if you dare &darr;
                    </div>

                    {/* Progressive Philosophy Reveal */}
                    <div className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex items-center justify-end z-10 pointer-events-none">
                        <div className="w-full lg:w-7/12 flex flex-col justify-center translate-y-32 md:translate-y-0 relative h-full items-end lg:items-start text-right lg:text-left">

                            {cards.map((card, i) => {
                                const cardCenter = (i * chunkSize) + (chunkSize / 2);
                                const distance = Math.abs(p2Progress - cardCenter);

                                // Opacity fades in/out based on distance from center time
                                const maxVis = chunkSize * 0.9;
                                const cardOpacity = p1Progress < 1 ? 0 : clamp(1 - (distance / maxVis), 0, 1);

                                // Y offset: starts below (+), moves to center, moves up (-)
                                const offsetProg = (p2Progress - cardCenter) / maxVis;
                                const yOffset = -offsetProg * 60; // 60px travel

                                return (
                                    <div
                                        key={i}
                                        className="absolute opacity-0 will-change-transform transform"
                                        style={{
                                            opacity: cardOpacity,
                                            transform: `translate3d(0, ${yOffset}px, 0)`,
                                            pointerEvents: cardOpacity > 0.1 ? 'auto' : 'none'
                                        }}
                                    >
                                        <h3 className="text-xs md:text-sm uppercase tracking-widest text-stone-500 mb-3 font-semibold">{card.title}</h3>
                                        <p className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight leading-snug text-stone-900 max-w-xl">
                                            {card.desc}
                                        </p>
                                    </div>
                                );
                            })}

                        </div>
                    </div>

                </div>
            </div>

            {/* PART 3: Experiments Hand-off */}
            {/* This renders after the 500vh container. So the sticky unpins and scrolls away naturally as this comes up. */}
            {hasItems && (
                <StaticExperiments items={clientItems} activeIndex={activeIndex} nextSlide={nextSlide} prevSlide={prevSlide} />
            )}
        </div>
    );
}

// Sub-component to keep render clean
function StaticExperiments({ items, activeIndex, prevSlide, nextSlide }: { items: any[], activeIndex: number, prevSlide: () => void, nextSlide: () => void }) {
    return (
        <section className="relative w-full px-6 md:px-12 xl:px-24 py-24 md:py-32 bg-[#FAFAF9] z-20 border-t border-stone-200">
            <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row relative items-start gap-16 lg:gap-8">

                {/* Left column spacer (matches DARE ANY WAY anchor margin) */}
                <div className="lg:w-4/12 xl:w-5/12 hidden lg:block">
                    {/* We can place a static DARE ANY WAY here to persist that anchor feeling seamlessly */}
                    <h2 className="text-[14vw] leading-[0.85] lg:text-[4.5vw] font-medium tracking-tighter uppercase text-stone-900 select-none opacity-[0.2]">
                        <span className="block">DARE</span>
                        <span className="block">ANY</span>
                        <span className="block">WAY</span>
                    </h2>
                </div>

                {/* Experiments Deck */}
                <div className="lg:w-8/12 xl:w-7/12 w-full flex flex-col relative min-h-[500px]">

                    {items.map((item, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <div
                                key={index}
                                className={`w-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0'}`}
                                style={{ '--accent': item.accent } as React.CSSProperties}
                            >
                                {/* Keyword / Enemy / Rallying Cry */}
                                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-8 lg:mb-10 text-[10px] md:text-xs uppercase tracking-widest font-semibold text-stone-900">
                                    <span className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-sm border-l-2" style={{ borderColor: 'var(--accent)' }}>
                                        {item.keyword}
                                    </span>
                                    <span className="text-stone-400">VS</span>
                                    <span className="text-stone-500">{item.enemy}</span>
                                    <span className="hidden sm:inline text-stone-300">&mdash;</span>
                                    <span style={{ color: 'var(--accent)' }}>{item.rallying_cry}</span>
                                </div>

                                {/* Question */}
                                <h2 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight mb-4 leading-snug max-w-2xl text-stone-900">
                                    {item.question}
                                </h2>

                                {/* Doubt */}
                                <p className="text-base md:text-lg text-stone-500 font-light italic mb-8 lg:mb-10 max-w-xl">
                                    «{item.doubt}»
                                </p>

                                <div className="h-px w-full max-w-sm bg-stone-200 mb-8 lg:mb-10"></div>

                                {/* Experiment Title */}
                                <h3 className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 mb-2 font-medium">
                                    Experiment // <span className="text-stone-600">{item.title}</span>
                                </h3>

                                {/* Result */}
                                <p className="text-sm md:text-base text-stone-800 leading-relaxed mb-10 max-w-xl font-light">
                                    {item.result}
                                </p>

                                {/* CTA */}
                                <div className="mt-auto flex items-start">
                                    <a
                                        href={item.ctaHref}
                                        className="inline-flex items-center justify-center bg-stone-900 text-[#FAFAF9] px-6 py-3 md:px-8 md:py-4 text-[10px] md:text-xs uppercase tracking-widest transition-transform hover:-translate-y-0.5 active:translate-y-0 font-semibold border border-transparent hover:border-stone-700"
                                    >
                                        {item.ctaLabel}
                                    </a>
                                </div>
                            </div>
                        );
                    })}

                    {/* Manual Controls */}
                    {items.length > 1 && (
                        <div className="mt-12 sm:mt-16 flex items-center gap-4 text-xs font-semibold tracking-widest uppercase text-stone-400 relative z-20">
                            <button onClick={prevSlide} className="hover:text-stone-900 transition-colors p-2 -ml-2 select-none group flex items-center gap-1">
                                <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Prev
                            </button>
                            <span className="w-6 h-px bg-stone-300"></span>
                            <span className="text-stone-900 min-w-[3ch] text-center">{`${activeIndex + 1}/${items.length}`}</span>
                            <span className="w-6 h-px bg-stone-300"></span>
                            <button onClick={nextSlide} className="hover:text-stone-900 transition-colors p-2 -mr-2 select-none group flex items-center gap-1">
                                Next <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
}
