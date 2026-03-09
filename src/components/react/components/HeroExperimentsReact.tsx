import React, { useEffect, useRef, useState } from 'react';
import type { HeroExperimentRow } from '../../server/modules/cms';

export interface HeroExperimentsReactProps {
    items: HeroExperimentRow[];
    lang?: string;
}

const SUPPORT_LINE_EN = "Curiosity over doubt.";
const SUPPORT_LINE_DE = "Neugier statt Zweifel.";

export default function HeroExperimentsReact({ items = [], lang = 'de' }: HeroExperimentsReactProps) {
    const isEn = lang === 'en';
    const supportLine = isEn ? SUPPORT_LINE_EN : SUPPORT_LINE_DE;

    const wrapperRef = useRef<HTMLDivElement>(null);

    const [progress, setProgress] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const hasItems = items.length > 0;

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

    const nextSlide = () => setActiveIndex(i => (i + 1) % clientItems.length);
    const prevSlide = () => setActiveIndex(i => (i - 1 + clientItems.length) % clientItems.length);

    useEffect(() => {
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

        const updateScroll = () => {
            if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const scrollableDistance = rect.height - viewportHeight;

                if (scrollableDistance > 0) {
                    // Progress of the 800vh wrapper specifically
                    const rawProgress = -rect.top / scrollableDistance;
                    setProgress(Math.min(Math.max(rawProgress, 0), 1));
                }
            }
            ticking = false;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        updateScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            mediaQuery.removeEventListener('change', onMediaChange);
        };
    }, []);

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    // ---------------------------------------------------------------------------
    // ANIMATION LOGIC (800vh Wrapper)
    // Phase 1 (0.00 - 0.15): Title shrinks & moves. Hint/Support fade.
    // Phase 2 (0.15 - 0.30): Courage
    // Phase 3 (0.30 - 0.45): Curiosity
    // Phase 4 (0.45 - 0.60): Experiment
    // Phase 5 (0.60 - 0.75): Proof
    // Phase 6 (0.75 - 0.90): Evidence Reveal
    // Phase 7 (0.90 - 1.00): Blank padding to let sticky scroll away naturally
    // ---------------------------------------------------------------------------

    const getPhaseState = (prog: number, start: number, end: number) => {
        const p = clamp((prog - start) / (end - start), 0, 1);
        if (p === 0) return { opacity: 0, y: 30 };
        if (p === 1) return { opacity: 0, y: -30 };

        let opacity = 0;
        let y = 0;

        // 25% fade in, 50% hold, 25% fade out
        if (p < 0.25) {
            opacity = p / 0.25;
            y = 30 * (1 - opacity);
        } else if (p < 0.75) {
            opacity = 1;
            y = 0;
        } else {
            opacity = 1 - ((p - 0.75) / 0.25);
            y = -30 * (1 - opacity);
        }
        return { opacity, y };
    };

    // Phase 1 Computations
    const titleProgress = clamp(progress / 0.15, 0, 1);
    const hintOpacity = 1 - clamp(titleProgress * 3, 0, 1); // fades very fast
    const supportOpacity = 1 - clamp(titleProgress * 2, 0, 1);

    // Ease In/Out for scale
    const easeInOut = (t: number) => (Math.sin((t - 0.5) * Math.PI) + 1) * 0.5;
    const titleScale = lerp(1, 0.45, easeInOut(titleProgress));

    // Note: we're using a max-w-[1400px] layout below, so we want the anchor to align with that left edge.
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const titleMoveX = isMobile ? lerp(0, -35, easeInOut(titleProgress)) : lerp(0, -32, easeInOut(titleProgress)); // vw
    const titleMoveY = isMobile ? lerp(0, -35, easeInOut(titleProgress)) : lerp(0, -35, easeInOut(titleProgress)); // vh
    const titleOpacity = lerp(1, 0.15, titleProgress); // Turns into a subtle background anchor

    // Phase 2-5 Computations
    const cards = [
        { title: "Courage", desc: "Move before certainty shows up." },
        { title: "Curiosity", desc: "Ask what others leave alone." },
        { title: "Experiment", desc: "Test the better idea." },
        { title: "Proof", desc: "Keep what actually works." }
    ];

    // Phase 6 Computations
    const evidenceState = getPhaseState(progress, 0.75, 0.90);


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

                <div className="py-24 flex justify-center">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-stone-900 uppercase">
                        The Evidence.
                    </h2>
                </div>

                {hasItems && (
                    <StaticExperiments items={clientItems} activeIndex={activeIndex} nextSlide={nextSlide} prevSlide={prevSlide} />
                )}

                {/* CTA Footer */}
                <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 xl:px-24 pb-32 pt-16 flex flex-col items-center justify-center gap-6 border-t border-stone-200 mt-16">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 font-semibold">Explore Further</span>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-2">
                        <a href="/work" className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1">
                            Go to Portfolio
                        </a>
                        <a href="/services" className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1">
                            Go to Services
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // Master Wrapper: Spans Intro + Experiments + Footer, so global sticky elements persist naturally
        <div className="relative w-full bg-[#FAFAF9] text-stone-900 border-b border-stone-200">

            {/* GLOBAL STICKY ANCHOR */}
            {/* This holds DARE ANY WAY and stays pinned until the very end of the component (past the footer) */}
            <div className="sticky top-0 w-full h-[100vh] overflow-hidden flex items-center justify-center pointer-events-none z-10">

                {/* Render grid background globally inside sticky so it never scrolls itself */}
                <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                {/* Dynamic Title Container */}
                <div
                    className={`absolute flex flex-col transform-origin-center will-change-transform ${titleProgress >= 0.5 ? 'items-start text-left' : 'items-center text-center'}`}
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
                        style={{ opacity: clamp(supportOpacity, 0, 1), height: titleProgress > 0.5 ? 0 : 'auto' }}>
                        {supportLine}
                    </div>
                </div>

            </div>

            {/* CONTENT LAYER */}
            {/* Pulls up 100vh to overlap the global sticky anchor visually */}
            <div className="relative w-full -mt-[100vh] z-20">

                {/* 800vh Narrative Scroll Wrapper */}
                <div ref={wrapperRef} className="relative w-full h-[800vh]">

                    <div className="sticky top-0 w-full h-[100vh] overflow-hidden flex items-center justify-center pointer-events-none">

                        {/* Scroll Hint (Phase 1) */}
                        <div
                            className="absolute bottom-12 text-stone-400 text-[10px] sm:text-xs tracking-widest uppercase font-semibold z-20 select-none will-change-opacity"
                            style={{ opacity: clamp(hintOpacity, 0, 1) }}
                        >
                            Scroll if you dare &darr;
                        </div>

                        {/* Principles (Phase 2-5) */}
                        <div className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex items-center justify-end z-10">
                            <div className="w-full lg:w-7/12 flex flex-col justify-center translate-y-32 md:translate-y-0 relative h-full items-end lg:items-start text-right lg:text-left">

                                {cards.map((card, i) => {
                                    const startPhase = 0.15 + (i * 0.15);
                                    const endPhase = startPhase + 0.15;
                                    const state = getPhaseState(progress, startPhase, endPhase);

                                    return (
                                        <div
                                            key={i}
                                            className="absolute will-change-transform transform"
                                            style={{
                                                opacity: state.opacity,
                                                transform: `translate3d(0, ${state.y}px, 0)`,
                                                pointerEvents: state.opacity > 0.1 ? 'auto' : 'none'
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

                        {/* Evidence Reveal (Phase 6) */}
                        <div className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex flex-col items-center justify-center z-10">
                            <div
                                className="will-change-transform transform text-center"
                                style={{
                                    opacity: evidenceState.opacity,
                                    transform: `translate3d(0, ${evidenceState.y}px, 0)`,
                                    pointerEvents: evidenceState.opacity > 0.1 ? 'auto' : 'none'
                                }}
                            >
                                <span className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 mb-6 font-semibold block">Proof</span>
                                <h2 className="text-3xl md:text-4xl lg:text-6xl font-medium tracking-tighter text-stone-900 uppercase">
                                    The Evidence.
                                </h2>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Phase 8: Experiments Deck */}
                {/* Document flow natively takes over. No scroll progress mapping needed. */}
                {hasItems && (
                    <StaticExperiments items={clientItems} activeIndex={activeIndex} nextSlide={nextSlide} prevSlide={prevSlide} />
                )}

                {/* CTA Footer */}
                <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 xl:px-24 pb-32 pt-16 flex flex-col items-center justify-center gap-6 pointer-events-auto border-t border-stone-200 mt-16 relative z-30 pointer-events-auto bg-[#FAFAF9]">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 font-semibold">Explore Further</span>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-2">
                        <a href="/work" className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1">
                            Go to Portfolio
                        </a>
                        <a href="/services" className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1">
                            Go to Services
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Sub-component payload
function StaticExperiments({ items, activeIndex, prevSlide, nextSlide }: { items: any[], activeIndex: number, prevSlide: () => void, nextSlide: () => void }) {
    return (
        <section className="relative w-full px-6 md:px-12 xl:px-24 py-24 md:py-32 z-30 pointer-events-auto">
            <div className="max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row relative items-start gap-16 lg:gap-8">

                {/* Left column spacer. We leave this empty. 
            The global sticky "DARE ANY WAY" anchor will perfectly slot visually into this empty space! */}
                <div className="lg:w-4/12 xl:w-5/12 hidden lg:block">
                </div>

                {/* Experiments Deck */}
                <div className="lg:w-8/12 xl:w-7/12 w-full flex flex-col relative min-h-[500px]">

                    {items.map((item, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <div
                                key={index}
                                className={`w-full flex flex-col transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0 transform translate-y-4'}`}
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
