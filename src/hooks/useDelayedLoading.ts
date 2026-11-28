import { useEffect, useRef, useState } from 'react';

export interface DelayedLoadingOptions {
  /**
   * Time in milliseconds before the loader is displayed.
   * If the loading finishes before this delay, no loader is ever shown (avoids flickering).
   * @default 180
   */
  delayMs?: number;
  /**
   * Minimum duration in milliseconds the loader remains visible once shown.
   * Prevents jarring sub-frame flashes if an operation finishes right after delayMs.
   * @default 250
   */
  minDurationMs?: number;
}

/**
 * Smart delayed loading hook.
 * Avoids flashing spinners for fast requests (<180ms) and ensures smooth,
 * stable presentation without delaying the underlying data or navigation operations.
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: DelayedLoadingOptions = {}
): boolean {
  const { delayMs = 180, minDurationMs = 250 } = options;
  const [showLoader, setShowLoader] = useState(false);

  const shownAtRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Clear any pending exit timers from a previous cycle
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current);
        minDurationTimerRef.current = null;
      }

      // If already showing, keep showing
      if (shownAtRef.current !== null) {
        setShowLoader(true);
        return;
      }

      // Set delay timer: only show if loading exceeds delayMs
      delayTimerRef.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowLoader(true);
      }, delayMs);
    } else {
      // Clear delay timer if loading finished before delay elapsed
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }

      // If loader was never displayed, we stay false immediately
      if (shownAtRef.current === null) {
        setShowLoader(false);
        return;
      }

      // Enforce minDurationMs so the loader doesn't disappear in a blink
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = Math.max(0, minDurationMs - elapsed);

      if (remaining === 0) {
        shownAtRef.current = null;
        setShowLoader(false);
      } else {
        minDurationTimerRef.current = setTimeout(() => {
          shownAtRef.current = null;
          setShowLoader(false);
        }, remaining);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, [isLoading, delayMs, minDurationMs]);

  return showLoader;
}
