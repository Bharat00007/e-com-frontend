import React from 'react';
import { CircularLoader } from './CircularLoader';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';

export interface PageTransitionLoaderProps {
  /** Display variant: page (default), section, or inline */
  variant?: 'page' | 'section' | 'inline';
  /** Optional message displayed below the loader */
  message?: string;
  /** Whether the underlying operation is currently active (defaults to true) */
  isLoading?: boolean;
  /** Optional custom class name */
  className?: string;
  /** Custom delay in ms before showing the loader (defaults to 180ms) */
  delayMs?: number;
}

/**
 * Intelligent, layout-preserving page and section transition loader.
 * Uses `useDelayedLoading` to prevent flashing on fast navigations (<180ms).
 * Keeps header, footer, and surrounding navigation stable and interactive.
 */
export const PageTransitionLoader: React.FC<PageTransitionLoaderProps> = ({
  variant = 'page',
  message = 'Loading...',
  isLoading = true,
  className = '',
  delayMs = 180,
}) => {
  const shouldRender = useDelayedLoading(isLoading, { delayMs, minDurationMs: 250 });

  if (!shouldRender) {
    // Preserve layout height to prevent sudden layout shift while waiting for delayMs
    if (variant === 'page') {
      return <div className="min-h-[40vh] w-full" aria-hidden="true" />;
    }
    if (variant === 'section') {
      return <div className="min-h-[200px] w-full" aria-hidden="true" />;
    }
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <CircularLoader size="sm" color="primary" inlineText={message} label={message} />
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div
        className={`w-full py-16 sm:py-20 flex flex-col items-center justify-center gap-3.5 animate-fade-in ${className}`}
        role="status"
        aria-live="polite"
      >
        <CircularLoader size="md" color="primary" label={message} />
        {message && (
          <p className="text-body-sm text-secondary font-medium tracking-wide">
            {message}
          </p>
        )}
      </div>
    );
  }

  // variant === 'page'
  return (
    <div
      className={`min-h-[55vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 flex flex-col items-center justify-center gap-4 animate-fade-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <CircularLoader size="lg" color="primary" label={message} />
      {message && (
        <p className="text-body-sm text-secondary font-medium tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
};
