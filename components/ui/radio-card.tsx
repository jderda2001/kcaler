'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadioCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
}

export const RadioCard = React.forwardRef<HTMLButtonElement, RadioCardProps>(
  ({ selected, title, description, badge, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all active:scale-[0.99]',
        selected
          ? 'border-foreground bg-foreground/[0.02]'
          : 'border-border bg-background hover:border-muted-foreground/40',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-foreground bg-foreground' : 'border-border bg-background',
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </div>
    </button>
  ),
);
RadioCard.displayName = 'RadioCard';
