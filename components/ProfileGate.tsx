'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await seedDatabase();
        const p = await getProfile();
        if (!alive) return;
        if (!p) router.replace('/onboarding');
        else setReady(true);
      } catch (err) {
        console.error('ProfileGate', err);
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 pb-20" aria-hidden>
        <svg width="56" height="56" viewBox="0 0 56 56" className="opacity-50">
          <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="35 100"
            className="text-foreground origin-center animate-spin"
            style={{ animationDuration: '1.2s' }}
          />
        </svg>
        <span className="text-muted-foreground text-xs">Ładowanie...</span>
      </div>
    );
  }

  return <>{children}</>;
}
