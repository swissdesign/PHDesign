import { RefObject, useEffect, useRef } from 'react';

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
  const lastWheelTs = useRef(0);
  const pointerState = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    lastTime: number;
  }>({ id: null, startX: 0, startY: 0, lastTime: 0 });
  const lockedHorizontal = useRef(false);
  const hasMoved = useRef(false);

  const axisKey = axis === 'x' ? 'clientX' : 'clientY';
  const crossAxisKey = axis === 'x' ? 'clientY' : 'clientX';

  const stop = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    velocityRef.current = 0;
  };

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

  // rAF loop for inertia decay
  const tick = () => {
    if (stopWhen) {
      stop();
      return;
    }
    let v = velocityRef.current;
    if (Math.abs(v) < minVelocity) {
      stop();
      if (snapPoints && snapPoints.length) {
        const current = getPosition();
        const nearest = snapPoints.reduce((closest, point) => {
          return Math.abs(point - current) < Math.abs(closest - current)
            ? point
            : closest;
        }, snapPoints[0]);
        if (prefersReducedMotion) {
          setPosition(nearest);
        } else {
          // quick snap
          requestAnimationFrame(() => setPosition(nearest));
        }
      }
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
      const primaryDelta =
        axis === 'x'
          ? Math.abs(e.deltaX) > Math.abs(e.deltaY)
            ? e.deltaX
            : e.deltaY
          : e.deltaY;

      if (!prefersReducedMotion) {
        // Prevent accidental vertical page scroll when we clearly intend horizontal
        if (axis === 'x' && Math.abs(primaryDelta) > Math.abs(e.deltaY) * 0.6) {
          e.preventDefault();
        }
      }

      velocityRef.current = primaryDelta;
      applyDelta(primaryDelta);
      lastWheelTs.current = performance.now();

      if (!prefersReducedMotion) {
        if (animRef.current === null) {
          animRef.current = requestAnimationFrame(tick);
        }
      }
    };

    const opts: AddEventListenerOptions = { passive: prefersReducedMotion };
    el.addEventListener('wheel', handleWheel, opts);
    return () => {
      el.removeEventListener('wheel', handleWheel, opts as EventListenerOptions);
    };
  }, [enabled, axis, prefersReducedMotion, stopWhen, friction]);

  // Pointer handlers
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const onPointerDownInternal = (e: PointerEvent) => {
      if (stopWhen) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      pointerState.current = {
        id: e.pointerId,
        startX: (e as any)[axisKey],
        startY: (e as any)[crossAxisKey],
        lastTime: performance.now(),
      };
      lockedHorizontal.current = false;
      hasMoved.current = false;
      stop(); // stop any existing inertia
      onPointerDown?.();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerState.current.id !== e.pointerId) return;
      const currentAxis = (e as any)[axisKey];
      const cross = (e as any)[crossAxisKey];
      const dx = currentAxis - pointerState.current.startX;
      const dy = cross - pointerState.current.startY;

      if (!lockedHorizontal.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 6) {
          lockedHorizontal.current = true;
        }
      }

      if (!lockedHorizontal.current) return;

      // prevent vertical scroll only once locked
      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - pointerState.current.lastTime);
      const delta = dx; // movement since start

      applyDelta(delta);
      velocityRef.current = (delta) / dt * 16; // normalize to 60fps tick
      velocityRef.current = Math.max(-maxVelocity, Math.min(maxVelocity, velocityRef.current));

      pointerState.current.startX = currentAxis;
      pointerState.current.startY = cross;
      pointerState.current.lastTime = now;
      hasMoved.current = hasMoved.current || Math.abs(delta) > 3;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerState.current.id !== e.pointerId) return;
      el.releasePointerCapture(e.pointerId);
      pointerState.current.id = null;
      if (!prefersReducedMotion && Math.abs(velocityRef.current) > minVelocity) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onStop?.();
      }
    };

    const onPointerCancel = onPointerUp;

    el.addEventListener('pointerdown', onPointerDownInternal);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);

    return () => {
      el.removeEventListener('pointerdown', onPointerDownInternal);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [enabled, stopWhen, prefersReducedMotion, maxVelocity, minVelocity]);

  // Stop inertia when requested externally
  useEffect(() => {
    if (stopWhen) stop();
  }, [stopWhen]);

  return { stop };
};
