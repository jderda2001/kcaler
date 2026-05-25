'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { copyLogs, getDailyLog, todayKey, yesterdayKey } from '@/lib/db';
import { useToast } from '@/components/Toaster';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  variant?: 'card' | 'inline';
}

export function CopyYesterdayButton({ className, variant = 'card' }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getDailyLog(yesterdayKey()).then((logs) => setCount(logs.length));
  }, []);

  async function handle() {
    if (!count || copying) return;
    setCopying(true);
    try {
      const n = await copyLogs(yesterdayKey(), todayKey());
      toast(`Skopiowano ${n} ${n === 1 ? 'wpis' : n < 5 ? 'wpisy' : 'wpisów'}`);
    } catch (e) {
      console.error(e);
      toast('Nie udało się skopiować', { type: 'error' });
    } finally {
      setCopying(false);
    }
  }

  if (count === null || count === 0) return null;

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={copying}
        className={cn(
          'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all active:scale-[0.99] disabled:opacity-50',
          className,
        )}
      >
        <Copy className="h-3.5 w-3.5" />
        {copying ? 'Kopiuję...' : `Skopiuj wczoraj (${count})`}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={copying}
      className={cn(
        'group border-border hover:border-foreground/30 hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border border-dashed p-4 text-left transition-all active:scale-[0.99] disabled:opacity-50',
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold">Powtórz wczorajszy dzień</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {count} {count === 1 ? 'wpis' : count < 5 ? 'wpisy' : 'wpisów'} — skopiuj jednym tapnięciem
        </p>
      </div>
      <span className="bg-foreground/[0.06] text-foreground flex h-9 w-9 items-center justify-center rounded-full">
        <Copy className="h-4 w-4" />
      </span>
    </button>
  );
}
