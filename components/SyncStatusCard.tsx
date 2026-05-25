'use client';

import { useEffect, useState } from 'react';
import { Check, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeSyncStatus, syncDown, syncUp, type SyncStatus } from '@/lib/sync';
import { cn } from '@/lib/utils';

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.round(diff / 1000);
  if (sec < 30) return 'przed chwilą';
  if (sec < 60) return `${sec}s temu`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min temu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} godz. temu`;
  const day = Math.round(hr / 24);
  return `${day} dni temu`;
}

export function SyncStatusCard() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((s, ls) => {
      setStatus(s);
      setLastSync(ls);
    });
    return unsub;
  }, []);

  async function manualSync() {
    setBusy(true);
    try {
      await syncUp();
      await syncDown();
    } finally {
      setBusy(false);
    }
  }

  const icon =
    status === 'syncing' ? RefreshCw : status === 'error' ? TriangleAlert : status === 'offline' ? CloudOff : Check;
  const Icon = icon;
  const label =
    status === 'syncing'
      ? 'Synchronizuję...'
      : status === 'error'
        ? 'Błąd synchronizacji'
        : status === 'offline'
          ? 'Offline — zsynchronizuję gdy wrócisz online'
          : lastSync
            ? `Zsynchronizowano ${timeAgo(lastSync)}`
            : 'Jeszcze nie zsynchronizowano';

  const tone =
    status === 'error'
      ? 'text-[hsl(0_70%_45%)]'
      : status === 'offline'
        ? 'text-muted-foreground'
        : status === 'syncing'
          ? 'text-foreground'
          : 'text-[hsl(142_70%_45%)]';

  return (
    <div className="border-border bg-background flex items-center gap-3 rounded-xl border p-4">
      <span
        className={cn(
          'bg-foreground/[0.06] flex h-9 w-9 items-center justify-center rounded-lg',
          tone,
        )}
      >
        <Icon className={cn('h-4 w-4', status === 'syncing' && 'animate-spin')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Synchronizacja chmurowa</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{label}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={manualSync}
        disabled={busy || status === 'syncing'}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
        Sync
      </Button>
    </div>
  );
}
