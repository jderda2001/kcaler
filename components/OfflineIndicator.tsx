'use client';

import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-md justify-center px-4 pt-3"
    >
      <div className="bg-foreground text-background flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-md value-fade">
        <CloudOff className="h-3.5 w-3.5" />
        Offline — zapisuje lokalnie
      </div>
    </div>
  );
}
