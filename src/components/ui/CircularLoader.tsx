import React from 'react';

export type CircularLoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CircularLoaderColor = 'primary' | 'white' | 'muted' | 'current';

export interface CircularLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant: xs (14px), sm (18px), md (28px), lg (40px), xl (52px) */
  size?: CircularLoaderSize;
  /** Color theme variant */
  color?: CircularLoaderColor;
  /** Accessible label for screen readers */
  label?: string;
  /** Optional stroke width override */
  strokeWidth?: number;
  /** Whether to show an optional text label next to/below the spinner */
  inlineText?: string;
}

const SIZE_CONFIG: Record<
  CircularLoaderSize,
  { dimension: number; defaultStroke: number; textSize: string; gap: string }
> = {
  xs: { dimension: 14, defaultStroke: 2.2, textSize: 'text-[11px]', gap: 'gap-1.5' },
  sm: { dimension: 18, defaultStroke: 2.5, textSize: 'text-xs', gap: 'gap-2' },
  md: { dimension: 28, defaultStroke: 3.0, textSize: 'text-sm', gap: 'gap-2.5' },
  lg: { dimension: 40, defaultStroke: 3.5, textSize: 'text-sm', gap: 'gap-3' },
  xl: { dimension: 52, defaultStroke: 4.0, textSize: 'text-base', gap: 'gap-3.5' },
};

const COLOR_CONFIG: Record<
  CircularLoaderColor,
  { stroke: string; track: string; textColor: string }
> = {
  // Dark forest-green brand identity (#104332 / #002c1e)
  primary: {
    stroke: '#104332',
    track: 'rgba(16, 67, 50, 0.12)',
    textColor: 'text-primary',
  },
  white: {
    stroke: '#ffffff',
    track: 'rgba(255, 255, 255, 0.25)',
    textColor: 'text-white',
  },
  muted: {
    stroke: '#717974',
    track: 'rgba(113, 121, 116, 0.15)',
    textColor: 'text-secondary',
  },
  current: {
    stroke: 'currentColor',
    track: 'currentColor',
    textColor: 'text-current',
  },
};

/**
 * Premium, lightweight circular loading indicator matching The Sniff Co. design system.
 * Features:
 * - Pure SVG + lightweight CSS animation
 * - Accessible semantics (`role="status"`, screen-reader text)
 * - Scalable size variants from button spinners (14px) to page loaders (52px)
 * - Zero external animation dependencies
 */
export const CircularLoader: React.FC<CircularLoaderProps> = ({
  size = 'md',
  color = 'primary',
  label = 'Loading content...',
  strokeWidth,
  inlineText,
  className = '',
  ...props
}) => {
  const { dimension, defaultStroke, textSize, gap } = SIZE_CONFIG[size];
  const strokeW = strokeWidth ?? defaultStroke;
  const colors = COLOR_CONFIG[color];

  // Circle geometry for viewBox 0 0 48 48
  const center = 24;
  const radius = center - strokeW - 1;
  const circumference = 2 * Math.PI * radius;
  // Arc length approx ~70% of circumference for elegant indeterminate spin
  const strokeDasharray = `${circumference * 0.7} ${circumference * 0.3}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center ${gap} ${className}`}
      {...props}
    >
      <svg
        className="animate-spin shrink-0"
        width={dimension}
        height={dimension}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Subtle background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeW}
          opacity={color === 'current' ? 0.2 : 1}
        />
        {/* Animated foreground arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
        />
      </svg>

      <span className="sr-only">{label}</span>

      {inlineText && (
        <span className={`font-medium ${textSize} ${colors.textColor}`}>
          {inlineText}
        </span>
      )}
    </div>
  );
};
