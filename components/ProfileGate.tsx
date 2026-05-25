'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clearAllData, getProfile } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { syncDown, syncUp } from '@/lib/sync';

const LAST_USER_KEY = 'kcal:last-user';

type Phase = 'idle' | 'seeding' | 'syncing' | 'profile' | 'ready';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (status === 'loading') return;
    let alive = true;

    (async () => {
      try {
        setPhase('seeding');
        await seedDatabase();

        if (status === 'authenticated' && session?.user?.id) {
          const userId = session.user.id;
          const lastUser =
            typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_USER_KEY) : null;

          setPhase('syncing');
          if (lastUser && lastUser !== userId) {
            // Different account on same device — wipe everything local and pull fresh.
            await clearAllData();
            await seedDatabase();
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('kcal:last-sync-ms');
              localStorage.setItem(LAST_USER_KEY, userId);
            }
          } else if (!lastUser) {
            // First login on this device — claim any local anonymous data, then mark.
            await syncUp();
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(LAST_USER_KEY, userId);
            }
          }
          await syncDown();
        }

        if (!alive) return;
        setPhase('profile');
        const p = await getProfile();
        if (!alive) return;
        if (!p) {
          router.replace('/onboarding');
          return;
        }
        setPhase('ready');
      } catch (err) {
        console.error('ProfileGate', err);
        if (alive) setPhase('ready');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, status, session?.user?.id]);

  if (phase !== 'ready') {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-2 pb-20"
        aria-hidden
      >
        <svg width="56" height="56" viewBox="0 0 56 56" className="opacity-50">
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border"
          />
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
        <span className="text-muted-foreground text-xs">
          {phase === 'syncing' ? 'Synchronizuję dane...' : 'Ładowanie...'}
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
