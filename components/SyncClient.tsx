'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { syncDown, syncUp } from '@/lib/sync';

const LAST_USER_KEY = 'kcal:last-user';

/**
 * Drives initial pull on login + pull on focus / online events.
 * Mount once near the root of the (app) layout.
 */
export function SyncClient() {
  const { data: session, status } = useSession();
  const claimedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    const userId = session.user.id;

    const lastUser = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_USER_KEY) : null;

    (async () => {
      if (lastUser !== userId) {
        // First time this user logs in on this device — claim local data and pull server state.
        if (!claimedRef.current) {
          claimedRef.current = true;
          await syncUp();
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem(LAST_USER_KEY, userId);
      }
      await syncDown();
    })().catch((e) => console.warn('initial sync failed', e));
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    function onFocus() {
      void syncDown();
    }
    function onOnline() {
      void syncDown();
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [status]);

  return null;
}
