'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { T } from '@/lib/i18n';

const items = [
  { href: '/', label: T.nav_today, icon: Home },
  { href: '/add', label: T.nav_add, icon: Plus },
  { href: '/history', label: T.nav_history, icon: CalendarDays },
  { href: '/settings', label: T.nav_settings, icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="border-border bg-background fixed inset-x-0 bottom-0 z-40 border-t">
      <div className="mx-auto flex h-16 w-full max-w-md items-stretch safe-bottom">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                  active && 'bg-foreground/[0.06]',
                )}
              >
                <Icon
                  className={cn('h-5 w-5 transition-transform', active && 'scale-105')}
                  strokeWidth={active ? 2.25 : 1.75}
                />
              </span>
              <span className={cn('text-[11px] transition-all', active && 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
