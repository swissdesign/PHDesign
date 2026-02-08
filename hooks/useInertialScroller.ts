import { RefObject, useCallback, useEffect, useRef } from 'react';

type Axis = 'x' | 'y';

interface InertiaOptions {
  enabled: boolean;
  axis?: Axis;
  friction?: number;
  maxVelocity?: number;
  minVelocity?: number;
  stopWhen?: boolean;
  snapPoints?: number[];
  bounds?: { min: number; max: number };
  // Position helpers for transform-based movement
  getPosition: () => number;
  setPosition: (next: number) => void;
  onMove?: (deltaAbs: number) => void;
  onPointerDown?: () => void;
  onStop?: () => void;
  prefersReducedMotion?: boolean;
}

interface InertialScroller {
  stop: () => void;
}

const WHEEL_LOCK_RATIO = 1.15;
const WHEEL_MIN = 2;
const DRAG_LOCK_RATIO = 1.2;
const DRAG_LOCK_PX = 6;

/**
 * Lightweight inertial scroll handler for transform / scrollLeft controlled surfaces.
 * Handles wheel + pointer with a horizontal-lock to avoid stealing page scroll.
 */
export const useInertialScroller = (
  ref: RefObject<HTMLElement>,
  {
    enabled,
    axis = 'x',
    friction = 0.94,
    maxVelocity = 60,
    minVelocity = 0.35,
    stopWhen = false,
    snapPoints,
    bounds,
    getPosition,
    setPosition,
    onMove,
    onPointerDown,
    onStop,
    prefersReducedMotion = false,
  }: InertiaOptions,
): InertialScroller => {
  const velocityRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const pointerState = useRef<{
    id: number | null;
    startPrimary: number;
    startCross: number;
    lastPrimary: number;
    lastCross: number;
    lastTime: number;
    hasCapture: boolean;
  }>({
    id: null,
    startPrimary: 0,
    startCross: 0,
    lastPrimary: 0,
    lastCross: 0,
    lastTime: 0,
    hasCapture: false,
  });
  const lockedHorizontal = useRef(false);

  const getPrimary = (event: PointerEvent): number =>
    axis === 'x' ? event.clientX : event.clientY;
  const getCross = (event: PointerEvent): number =>
    axis === 'x' ? event.clientY : event.clientX;

  const stop = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    velocityRef.current = 0;
  }, []);

  const applyDelta = (delta: number) => {
    const nextRaw = getPosition() + delta;
    const next = bounds
      ? Math.min(bounds.max, Math.max(bounds.min, nextRaw))
      : nextRaw;
    // If we hit bounds, bleed velocity so we don't jitter
    if (bounds && (next === bounds.min || next === bounds.max)) {
      velocityRef.current *= 0.35;
    }
    setPosition(next);
    onMove?.(Math.abs(delta));
  };

  const snapToNearest = () => {
    if (!snapPoints || snapPoints.length === 0) return;
    const current = getPosition();
    const nearest = snapPoints.reduce((closest, point) => {
      return Math.abs(point - current) < Math.abs(closest - current)
        ? point
        : closest;
    }, snapPoints[0]);
    if (prefersReducedMotion) {
      setPosition(nearest);
      return;
    }
    requestAnimationFrame(() => setPosition(nearest));
  };

  // rAF loop for inertia decay
  const tick = () => {
    if (stopWhen) {
      stop();
      onStop?.();
      return;
    }
    let v = velocityRef.current;
    if (Math.abs(v) < minVelocity) {
      stop();
      snapToNearest();
      onStop?.();
      return;
    }
    applyDelta(v);
    v *= friction;
    v = Math.max(-maxVelocity, Math.min(maxVelocity, v));
    velocityRef.current = v;
    animRef.current = requestAnimationFrame(tick);
  };

  // Wheel handler
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const handleWheel = (e: WheelEvent) => {
      if (stopWhen) return;

      if (axis !== 'x') {
        const delta = e.deltaY;
        velocityRef.current = delta;
        applyDelta(delta);
        if (!prefersReducedMotion && animRef.current === null) {
          animRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);
      const horizontalIntent =
        absDeltaX > absDeltaY * WHEEL_LOCK_RATIO ||
        absDeltaX > WHEEL_MIN ||
        (e.shiftKey && absDeltaY > WHEEL_MIN);

      if (!horizontalIntent) return;

      const horizontalDelta =
        absDeltaX > WHEEL_MIN ? e.deltaX : e.shiftKey ? e.deltaY : 0;

      if (horizontalDelta === 0) return;

      // For true diagonal trackpad gestures, keep browser vertical scroll active.
      const usingShiftTranslation = e.shiftKey && absDeltaX <= WHEEL_MIN;
      const shouldPreventDefault = usingShiftTranslation || absDeltaY <= WHEEL_MIN;
      if (shouldPreventDefault && e.cancelable) {
        e.preventDefault();
      }

      velocityRef.current = horizontalDelta;
      applyDelta(horizontalDelta);

      if (!prefersReducedMotion) {
        if (animRef.current === null) {
          animRef.current = requestAnimationFrame(tick);
        }
      } else {
        snapToNearest();
      }
    };

    // passive:false is required so we can preventDefault only after horizontal intent is detected.
    const opts: AddEventListenerOptions = { passive: axis !== 'x' };
    el.addEventListener('wheel', handleWheel, opts);
    return () => {
      el.removeEventListener('wheel', handleWheel, opts as EventListenerOptions);
    };
  }, [enabled, axis, prefersReducedMotion, stopWhen, friction, stop]);

  // Pointer handlers
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const onPointerDownInternal = (e: PointerEvent) => {
      if (stopWhen) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const primary = getPrimary(e);
      const cross = getCross(e);
      pointerState.current = {
        id: e.pointerId,
        startPrimary: primary,
        startCross: cross,
        lastPrimary: primary,
        lastCross: cross,
        lastTime: performance.now(),
        hasCapture: false,
      };
      lockedHorizontal.current = false;
      stop(); // stop any existing inertia
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerState.current.id !== e.pointerId) return;
      const currentPrimary = getPrimary(e);
      const currentCross = getCross(e);
      const dx = currentPrimary - pointerState.current.startPrimary;
      const dy = currentCross - pointerState.current.startCross;

      if (!lockedHorizontal.current) {
        if (Math.abs(dx) > Math.abs(dy) * DRAG_LOCK_RATIO && Math.abs(dx) > DRAG_LOCK_PX) {
          lockedHorizontal.current = true;
          if (!pointerState.current.hasCapture) {
            try {
              el.setPointerCapture(e.pointerId);
              pointerState.current.hasCapture = true;
            } catch {
              pointerState.current.hasCapture = false;
            }
          }
          pointerState.current.lastPrimary = currentPrimary;
          pointerState.current.lastCross = currentCross;
          pointerState.current.lastTime = performance.now();
          onPointerDown?.();
        } else {
          // Not locked yet, so vertical page scroll remains native.
          return;
        }
      }

      // Prevent vertical page scroll only after horizontal lock.
      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - pointerState.current.lastTime);
      const delta = currentPrimary - pointerState.current.lastPrimary;

      applyDelta(delta);
      velocityRef.current = delta / dt * 16; // normalize to 60fps tick
      velocityRef.current = Math.max(-maxVelocity, Math.min(maxVelocity, velocityRef.current));

      pointerState.current.lastPrimary = currentPrimary;
      pointerState.current.lastCross = currentCross;
      pointerState.current.lastTime = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerState.current.id !== e.pointerId) return;
      if (pointerState.current.hasCapture) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // no-op: capture may already be released by browser
        }
      }
      const wasLocked = lockedHorizontal.current;
      pointerState.current.id = null;
      pointerState.current.hasCapture = false;
      lockedHorizontal.current = false;

      if (wasLocked && !prefersReducedMotion && Math.abs(velocityRef.current) > minVelocity) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        velocityRef.current = 0;
        if (wasLocked) snapToNearest();
        onStop?.();
      }
    };

    const onPointerCancel = onPointerUp;

    el.addEventListener('pointerdown', onPointerDownInternal);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);

    return () => {
      el.removeEventListener('pointerdown', onPointerDownInternal);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [enabled, stopWhen, prefersReducedMotion, maxVelocity, minVelocity, stop]);

  // Stop inertia when requested externally
  useEffect(() => {
    if (stopWhen) stop();
  }, [stopWhen, stop]);

  return { stop };
};
