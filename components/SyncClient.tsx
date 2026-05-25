'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { syncDown } from '@/lib/sync';

/**
 * Once initial pull is done in ProfileGate, SyncClient handles refresh-on-focus
 * and online events to keep data fresh without page reloads.
 */
export function SyncClient() {
  const { status } = useSession();

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
