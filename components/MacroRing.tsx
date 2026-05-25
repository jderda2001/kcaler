import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  stroke?: number;
  value: number;
  goal: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}

export function MacroRing({
  size = 240,
  stroke = 12,
  value,
  goal,
  color = 'var(--color-kcal)',
  trackColor = 'var(--color-border)',
  className,
  children,
  ariaLabel,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0;
  const dashOffset = circumference * (1 - pct);

  // Bounce when crossing from 0 to >0 (first add of the day / session)
  const prev = useRef(value);
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (prev.current === 0 && value > 0) {
      setBounce(true);
      const t = window.setTimeout(() => setBounce(false), 650);
      prev.current = value;
      return () => window.clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        bounce && 'ring-bounce',
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
        className="block"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        />
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
