'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleGroupProps<T extends string> {
  options: Array<{ value: T; label: string; subtitle?: string }>;
  value: T | undefined;
  onChange: (value: T) => void;
  className?: string;
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        'border-border bg-muted/40 grid grid-flow-col auto-cols-fr gap-1 rounded-xl border p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={cn(
              'flex min-h-[40px] flex-col items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-all',
              selected
                ? 'bg-background text-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{opt.label}</span>
            {opt.subtitle && (
              <span className="text-muted-foreground mt-0.5 text-[10px] font-normal">
                {opt.subtitle}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
