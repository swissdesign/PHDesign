import { useEffect, useState } from 'react';

// Small helper to respect user motion settings
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handle);
    } else {
      // @ts-ignore Safari fallback
      mql.addListener(handle);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handle);
      } else {
        // @ts-ignore Safari fallback
        mql.removeListener(handle);
      }
    };
  }, []);

  return reduced;
};
