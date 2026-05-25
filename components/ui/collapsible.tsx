'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}

export function Collapsible({ title, children, defaultOpen = false, badge }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-border bg-background overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-muted/40 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-border border-t px-4 pb-4 pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
