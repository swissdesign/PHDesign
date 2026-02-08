import { RefObject, useCallback, useEffect, useRef } from 'react';

type Axis = 'x' | 'y' | 'both';

type AxisBounds = { min: number; max: number };
type PanBounds = { x: AxisBounds; y: AxisBounds };
type PanPosition = { x: number; y: number };

interface InertiaOptions {
  enabled: boolean;
  axis?: Axis;
  friction?: number;
  maxVelocity?: number;
  minVelocity?: number;
  stopWhen?: boolean;
  bounds?: PanBounds;
  getPosition: () => PanPosition;
  setPosition: (next: PanPosition) => void;
  onMove?: (deltaAbs: number) => void;
  onInteractionStart?: () => void;
  onPanStart?: () => void;
  onStop?: () => void;
  prefersReducedMotion?: boolean;
}

interface InertialScroller {
  stop: () => void;
  setPosition: (next: PanPosition) => void;
}

const DRAG_DEADZONE_PX = 6;
const EDGE_DAMPING = 0.35;
const WHEEL_MIN = 2;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * 2D inertial drag panner for transform-based surfaces.
 * Tune feel: `friction`, `maxVelocity`, `minVelocity`.
 */
export const useInertialScroller = (
  ref: RefObject<HTMLElement>,
  {
    enabled,
    axis = 'both',
    friction = 0.94,
    maxVelocity = 55,
    minVelocity = 0.4,
    stopWhen = false,
    bounds,
    getPosition,
    setPosition,
    onMove,
    onInteractionStart,
    onPanStart,
    onStop,
    prefersReducedMotion = false,
  }: InertiaOptions,
): InertialScroller => {
  const velocityRef = useRef<PanPosition>({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);
  const boundsRef = useRef(bounds);
  const getPositionRef = useRef(getPosition);
  const setPositionRef = useRef(setPosition);
  const onMoveRef = useRef(onMove);
  const onInteractionStartRef = useRef(onInteractionStart);
  const onPanStartRef = useRef(onPanStart);
  const onStopRef = useRef(onStop);
  const stopWhenRef = useRef(stopWhen);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  const frictionRef = useRef(friction);
  const maxVelocityRef = useRef(maxVelocity);
  const minVelocityRef = useRef(minVelocity);
  const pointerState = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    hasCapture: boolean;
    panningActive: boolean;
  }>({
    id: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    hasCapture: false,
    panningActive: false,
  });

  const allowX = axis === 'x' || axis === 'both';
  const allowY = axis === 'y' || axis === 'both';

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);
  useEffect(() => {
    getPositionRef.current = getPosition;
  }, [getPosition]);
  useEffect(() => {
    setPositionRef.current = setPosition;
  }, [setPosition]);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);
  useEffect(() => {
    onInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);
  useEffect(() => {
    onPanStartRef.current = onPanStart;
  }, [onPanStart]);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);
  useEffect(() => {
    stopWhenRef.current = stopWhen;
  }, [stopWhen]);
  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);
  useEffect(() => {
    frictionRef.current = friction;
  }, [friction]);
  useEffect(() => {
    maxVelocityRef.current = maxVelocity;
  }, [maxVelocity]);
  useEffect(() => {
    minVelocityRef.current = minVelocity;
  }, [minVelocity]);

  const clampPosition = useCallback(
    (next: PanPosition): PanPosition => {
      const liveBounds = boundsRef.current;
      if (!liveBounds) return next;
      return {
        x: clamp(next.x, liveBounds.x.min, liveBounds.x.max),
        y: clamp(next.y, liveBounds.y.min, liveBounds.y.max),
      };
    },
    [],
  );

  const stop = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  const setPositionClamped = useCallback(
    (next: PanPosition) => {
      setPositionRef.current(clampPosition(next));
    },
    [clampPosition],
  );

  const applyDelta = (deltaX: number, deltaY: number) => {
    const current = getPositionRef.current();
    const appliedX = allowX ? deltaX : 0;
    const appliedY = allowY ? deltaY : 0;
    const rawNext = {
      x: current.x + appliedX,
      y: current.y + appliedY,
    };
    const next = clampPosition(rawNext);

    if (boundsRef.current) {
      if (next.x !== rawNext.x) velocityRef.current.x *= EDGE_DAMPING;
      if (next.y !== rawNext.y) velocityRef.current.y *= EDGE_DAMPING;
    }

    setPositionRef.current(next);
    onMoveRef.current?.(Math.hypot(appliedX, appliedY));
  };

  const tick = () => {
    if (stopWhenRef.current) {
      stop();
      onStopRef.current?.();
      return;
    }

    const { x: vx, y: vy } = velocityRef.current;
    if (
      Math.abs(vx) < minVelocityRef.current &&
      Math.abs(vy) < minVelocityRef.current
    ) {
      stop();
      onStopRef.current?.();
      return;
    }

    applyDelta(vx, vy);

    velocityRef.current = {
      x: clamp(vx * frictionRef.current, -maxVelocityRef.current, maxVelocityRef.current),
      y: clamp(vy * frictionRef.current, -maxVelocityRef.current, maxVelocityRef.current),
    };

    animRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const handleWheel = (e: WheelEvent) => {
      if (stopWhenRef.current || !allowX) return;

      // Keep wheel native by default. Optional horizontal pan on Shift+wheel.
      if (!e.shiftKey || Math.abs(e.deltaY) <= WHEEL_MIN) return;
      if (e.cancelable) e.preventDefault();

      const deltaX = e.deltaY;
      applyDelta(deltaX, 0);
      velocityRef.current.x = clamp(
        deltaX,
        -maxVelocityRef.current,
        maxVelocityRef.current,
      );
      velocityRef.current.y = 0;

      if (!prefersReducedMotionRef.current && animRef.current === null) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, allowX]);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (stopWhenRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      pointerState.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        hasCapture: false,
        panningActive: false,
      };
      stop();
      onInteractionStartRef.current?.();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerState.current.id !== e.pointerId) return;

      const totalDx = e.clientX - pointerState.current.startX;
      const totalDy = e.clientY - pointerState.current.startY;

      if (!pointerState.current.panningActive) {
        const dragDistance =
          axis === 'both'
            ? Math.hypot(totalDx, totalDy)
            : axis === 'x'
              ? Math.abs(totalDx)
              : Math.abs(totalDy);
        if (dragDistance <= DRAG_DEADZONE_PX) return;

        pointerState.current.panningActive = true;
        if (!pointerState.current.hasCapture) {
          try {
            el.setPointerCapture(e.pointerId);
            pointerState.current.hasCapture = true;
          } catch {
            pointerState.current.hasCapture = false;
          }
        }
        pointerState.current.lastX = e.clientX;
        pointerState.current.lastY = e.clientY;
        pointerState.current.lastTime = performance.now();
        onPanStartRef.current?.();
      }

      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - pointerState.current.lastTime);
      const deltaX = e.clientX - pointerState.current.lastX;
      const deltaY = e.clientY - pointerState.current.lastY;

      applyDelta(deltaX, deltaY);
      velocityRef.current = {
        x: clamp(
          (allowX ? deltaX : 0) / dt * 16,
          -maxVelocityRef.current,
          maxVelocityRef.current,
        ),
        y: clamp(
          (allowY ? deltaY : 0) / dt * 16,
          -maxVelocityRef.current,
          maxVelocityRef.current,
        ),
      };

      pointerState.current.lastX = e.clientX;
      pointerState.current.lastY = e.clientY;
      pointerState.current.lastTime = now;
    };

    const finishPointer = (e: PointerEvent, shouldStartInertia: boolean) => {
      if (pointerState.current.id !== e.pointerId) return;

      if (pointerState.current.hasCapture) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // Pointer capture may already be released by the browser.
        }
      }

      const wasPanning = pointerState.current.panningActive;
      pointerState.current.id = null;
      pointerState.current.hasCapture = false;
      pointerState.current.panningActive = false;

      if (!wasPanning) return;

      if (
        shouldStartInertia &&
        !prefersReducedMotionRef.current &&
        (Math.abs(velocityRef.current.x) > minVelocityRef.current ||
          Math.abs(velocityRef.current.y) > minVelocityRef.current)
      ) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        stop();
        onStopRef.current?.();
      }
    };

    const onPointerUp = (e: PointerEvent) => finishPointer(e, true);
    const onPointerCancel = (e: PointerEvent) => finishPointer(e, false);

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [enabled, axis, allowX, allowY, stop]);

  useEffect(() => {
    if (stopWhen) stop();
  }, [stopWhen, stop]);

  useEffect(() => () => stop(), [stop]);

  return { stop, setPosition: setPositionClamped };
};
