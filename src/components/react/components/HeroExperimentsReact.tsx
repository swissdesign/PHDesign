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
        const appMount = document.getElementById('app-mount');
        if (appMount) {
            appMount.style.height = '0';
            appMount.style.overflow = 'hidden';
            appMount.style.opacity = '0';
        }
    }, []);

    const handleRevealAppView = (e: React.MouseEvent<HTMLAnchorElement>, view: 'work' | 'services') => {
        const isMobileDevice = typeof window !== 'undefined' ? window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches : false;
        
        if (isMobileDevice) {
            // Let the default navigation happen or force it if needed,
            // but since the href is updated below, just return if mobile.
            // Actually, we'll let the standard anchor tag behavior work 
            // by returning early, so we don't preventDefault.
            return;
        }

        e.preventDefault();

        // Update URL state without reload
        const url = new URL(window.location.href);
        url.searchParams.set('view', view);
        window.history.pushState({}, '', url.toString());

        // Dispatch event for App.tsx to catch
        window.dispatchEvent(new CustomEvent('ph-view-change', { detail: view }));

        const appMount = document.getElementById('app-mount');
        if (appMount) {
            appMount.style.height = 'auto';
            appMount.style.overflow = 'visible';
            appMount.style.opacity = '1';
            appMount.style.transition = 'opacity 1s ease';

            setTimeout(() => {
                appMount.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    };

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

    // 1200vh Wrapper Scaling
    const p_Title = clamp(progress / 0.10, 0, 1);
    const p_Evidence = clamp((progress - 0.58) / 0.12, 0, 1);
    const p_Assemble = clamp((progress - 0.70) / 0.15, 0, 1);
    const p_Hold = clamp((progress - 0.85) / 0.15, 0, 1);

    const getPhaseState = (prog: number, start: number, end: number) => {
        const p = clamp((prog - start) / (end - start), 0, 1);
        if (p === 0) return { opacity: 0, y: 40 };
        if (p === 1) return { opacity: 0, y: -40 };

        let opacity = 0;
        let y = 0;

        if (p < 0.3) {
            opacity = p / 0.3;
            y = 40 * (1 - opacity);
        } else if (p < 0.7) {
            opacity = 1;
            y = 0;
        } else {
            opacity = 1 - ((p - 0.7) / 0.3);
            y = -40 * (1 - opacity);
        }
        return { opacity, y };
    };

    const hintOpacity = 1 - clamp(p_Title * 3, 0, 1);
    const supportOpacity = 1 - clamp(p_Title * 2, 0, 1);

    const easeInOut = (t: number) => (Math.sin((t - 0.5) * Math.PI) + 1) * 0.5;
    const titleScale = lerp(1, 0.45, easeInOut(p_Title));

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    const titleMoveX = isMobile ? lerp(0, -35, easeInOut(p_Title)) : lerp(0, -32, easeInOut(p_Title));
    const titleMoveY = isMobile ? lerp(0, -35, easeInOut(p_Title)) : lerp(0, -35, easeInOut(p_Title));
    const titleOpacity = lerp(1, 0.2, p_Title);

    const cards = [
        { title: "Courage", desc: "Move before certainty shows up." },
        { title: "Curiosity", desc: "Ask what others leave alone." },
        { title: "Experiment", desc: "Test the better idea." },
        { title: "Proof", desc: "Keep what actually works." }
    ];

    const evidenceState = getPhaseState(progress, 0.58, 0.70);

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const ap = easeOut(p_Assemble);

    // Different directional motion offsets for experimental assembly
    const assembleStyle = {
        keyword: {
            opacity: clamp(ap / 0.4, 0, 1),
            transform: `translate3d(0, ${lerp(20, 0, clamp(ap / 0.4, 0, 1))}px, 0)`
        },
        question: {
            opacity: clamp((ap - 0.2) / 0.4, 0, 1),
            transform: `translate3d(${lerp(-30, 0, clamp((ap - 0.2) / 0.4, 0, 1))}px, 0, 0)`
        },
        doubt: {
            opacity: clamp((ap - 0.4) / 0.4, 0, 1),
            transform: `translate3d(0, ${lerp(20, 0, clamp((ap - 0.4) / 0.4, 0, 1))}px, 0)`
        },
        line: {
            opacity: clamp((ap - 0.6) / 0.3, 0, 1),
            transform: `scaleX(${clamp((ap - 0.6) / 0.3, 0, 1)})`,
            transformOrigin: 'left' as const
        },
        body: {
            opacity: clamp((ap - 0.7) / 0.3, 0, 1),
            transform: `translate3d(0, ${lerp(20, 0, clamp((ap - 0.7) / 0.3, 0, 1))}px, 0)`
        },
        controls: {
            opacity: clamp((ap - 0.8) / 0.2, 0, 1),
            transform: `translate3d(0, ${lerp(20, 0, clamp((ap - 0.8) / 0.2, 0, 1))}px, 0)`
        }
    };

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

                <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 xl:px-24 pb-32 pt-16 flex flex-col items-center justify-center gap-6 border-t border-stone-200 mt-16 pointer-events-auto relative z-30">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 font-semibold">Explore Further</span>
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-2">
                        <a href={`/${lang}/work`} onClick={(e) => handleRevealAppView(e, 'work')} className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1 cursor-pointer">
                            Go to Portfolio &rarr;
                        </a>
                        <a href={`/${lang}/services`} onClick={(e) => handleRevealAppView(e, 'services')} className="text-xs md:text-sm uppercase tracking-widest font-semibold text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition-colors pb-1 cursor-pointer">
                            Go to Services &rarr;
                        </a>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="relative w-full bg-[#FAFAF9] text-stone-900 border-b border-stone-200">

            {/* Narrative Scroll Wrapper */}
            <div ref={wrapperRef} className="relative w-full h-[1000vh] lg:h-[1200vh]">

                <div className="sticky top-0 w-full h-[100vh] overflow-hidden flex flex-col pointer-events-none z-10 font-sans">

                    <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                    {/* DARE ANY WAY Anchor */}
                    <div
                        className={`absolute flex flex-col transform-origin-center will-change-transform z-10 text-center items-center justify-center inset-0 pointer-events-none pb-24 lg:pb-0`}
                    >
                        <div
                            style={{
                                transform: `translate3d(${titleMoveX}vw, ${titleMoveY}vh, 0) scale(${titleScale})`,
                                opacity: titleOpacity,
                                transformOrigin: 'center'
                            }}
                            className={`flex flex-col transition-all duration-300 ${p_Title >= 0.5 ? 'items-start text-left' : 'items-center text-center'}`}
                        >
                            <h1 className="text-[14vw] leading-[0.85] md:text-[10vw] font-medium tracking-tighter uppercase mb-6 sm:mb-8 text-stone-900 select-none">
                                <span className="block text-stone-900">DARE</span>
                                <span className="block text-stone-900">ANY</span>
                                <span className="block text-stone-400">WAY</span>
                            </h1>
                            <div className="text-xl md:text-3xl font-light tracking-tight text-stone-500 will-change-opacity overflow-hidden"
                                style={{ opacity: clamp(supportOpacity, 0, 1), maxHeight: p_Title > 0.5 ? 0 : '100px' }}>
                                {supportLine}
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute bottom-12 left-0 right-0 text-center text-stone-400 text-[10px] sm:text-xs tracking-widest uppercase font-semibold z-20 select-none will-change-opacity"
                        style={{ opacity: clamp(hintOpacity, 0, 1) }}
                    >
                        Scroll if you dare &darr;
                    </div>

                    {/* Principles */}
                    <div className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex items-center justify-end z-20 pointer-events-none pt-12 lg:pt-0">
                        <div className="w-full lg:w-7/12 flex flex-col justify-center relative h-full items-end lg:items-start text-right lg:text-left">
                            {cards.map((card, i) => {
                                const startPhase = 0.10 + (i * 0.12);
                                const endPhase = startPhase + 0.12;
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

                    {/* Evidence Reveal Label */}
                    <div className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex flex-col items-center justify-center z-10 pt-12 lg:pt-0">
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

                    {/* Assembled Experiments */}
                    {hasItems && (
                        <div
                            className="absolute inset-0 max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 flex flex-col justify-center z-30 pointer-events-none"
                        >
                            <div className="w-full flex flex-col lg:flex-row items-center justify-end relative h-full pt-[20vh] sm:pt-16 lg:pt-0">

                                <div className="lg:w-4/12 xl:w-5/12 hidden lg:block"></div>

                                <div className="lg:w-8/12 xl:w-7/12 w-full flex flex-col relative" style={{ opacity: ap > 0.01 ? 1 : 0 }}>

                                    <div className="relative min-h-[380px] sm:min-h-[460px] pointer-events-auto">
                                        {clientItems.map((item, index) => {
                                            const isActive = index === activeIndex;

                                            const getStyle = (layer: keyof typeof assembleStyle) => {
                                                if (index === 0) return assembleStyle[layer];
                                                return {};
                                            };

                                            return (
                                                <div
                                                    key={index}
                                                    className={`w-full flex flex-col absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                                    style={{ '--accent': item.accent } as React.CSSProperties}
                                                >
                                                    <div style={getStyle('keyword')} className="will-change-transform">
                                                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 sm:mb-8 text-[10px] md:text-xs uppercase tracking-widest font-semibold text-stone-900">
                                                            <span className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-sm border-l-2" style={{ borderColor: 'var(--accent)' }}>
                                                                {item.keyword}
                                                            </span>
                                                            <span className="text-stone-400">VS</span>
                                                            <span className="text-stone-500">{item.enemy}</span>
                                                            <span className="hidden sm:inline text-stone-300">&mdash;</span>
                                                            <span style={{ color: 'var(--accent)' }}>{item.rallying_cry}</span>
                                                        </div>
                                                    </div>

                                                    <div style={getStyle('question')} className="will-change-transform">
                                                        <h2 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight mb-4 leading-snug max-w-2xl text-stone-900">
                                                            {item.question}
                                                        </h2>
                                                    </div>

                                                    <div style={getStyle('doubt')} className="will-change-transform">
                                                        <p className="text-base md:text-lg text-stone-500 font-light italic mb-6 lg:mb-8 max-w-xl">
                                                            «{item.doubt}»
                                                        </p>
                                                    </div>

                                                    <div style={getStyle('line')} className="will-change-transform origin-left h-px w-full max-w-sm bg-stone-200 mb-6 lg:mb-8"></div>

                                                    <div style={getStyle('body')} className="will-change-transform">
                                                        <h3 className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 mb-2 font-medium">
                                                            Experiment // <span className="text-stone-600">{item.title}</span>
                                                        </h3>

                                                        <p className="text-sm md:text-base text-stone-800 leading-relaxed max-w-xl font-light mb-8">
                                                            {item.result}
                                                        </p>
                                                    </div>

                                                    <div style={getStyle('controls')} className="will-change-transform mt-auto flex items-start z-30 relative pointer-events-auto">
                                                        <a
                                                            href={item.ctaHref}
                                                            className="inline-flex items-center justify-center bg-stone-900 text-[#FAFAF9] px-6 py-3 sm:px-8 sm:py-4 text-[10px] md:text-xs uppercase tracking-widest transition-transform hover:-translate-y-0.5 active:translate-y-0 font-semibold border border-transparent hover:border-stone-700"
                                                        >
                                                            {item.ctaLabel}
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={assembleStyle.controls} className="will-change-transform z-20 relative pt-2 sm:pt-6">
                                        {clientItems.length > 1 && (
                                            <div className="flex items-center gap-4 text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-stone-400 relative pointer-events-auto">
                                                <button onClick={prevSlide} className="hover:text-stone-900 transition-colors py-2 pr-2 select-none group flex items-center gap-1">
                                                    <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Prev
                                                </button>
                                                <span className="w-6 h-px bg-stone-300"></span>
                                                <span className="text-stone-900 min-w-[3ch] text-center">{`${activeIndex + 1}/${clientItems.length}`}</span>
                                                <span className="w-6 h-px bg-stone-300"></span>
                                                <button onClick={nextSlide} className="hover:text-stone-900 transition-colors py-2 pl-2 select-none group flex items-center gap-1">
                                                    Next <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="flex items-start sm:items-center gap-4 sm:gap-12 mt-8 sm:mt-12 pt-6 border-t border-stone-200 will-change-transform pointer-events-auto"
                                        style={{ opacity: p_Hold, transform: `translate3d(0, ${lerp(20, 0, p_Hold)}px, 0)` }}
                                    >
                                        <span className="text-[10px] md:text-xs uppercase tracking-widest text-stone-400 font-semibold -mt-1 hidden sm:block w-[120px]">Explore</span>
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
                                            <a href={`/${lang}/work`} onClick={(e) => handleRevealAppView(e, 'work')} className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer">
                                                Go to Portfolio &rarr;
                                            </a>
                                            <a href={`/${lang}/services`} onClick={(e) => handleRevealAppView(e, 'services')} className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer">
                                                Go to Services &rarr;
                                            </a>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
