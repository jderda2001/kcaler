'use client';

import { useEffect, useState } from 'react';
import { Share, Plus, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'kcal:install-dismissed-v1';
const MIN_SESSIONS_KEY = 'kcal:sessions';
const SHOW_AFTER_SESSIONS = 2;

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    // @ts-expect-error nonstandard
    window.navigator.standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isStandalone()) return;
    if (typeof localStorage === 'undefined') return;

    // Session count gate
    const prior = Number(localStorage.getItem(MIN_SESSIONS_KEY) ?? '0');
    const next = prior + 1;
    localStorage.setItem(MIN_SESSIONS_KEY, String(next));
    if (next < SHOW_AFTER_SESSIONS) return;

    if (localStorage.getItem(DISMISS_KEY)) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as DeferredPrompt);
      setOpen(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (isIos()) {
      setShowIos(true);
      setOpen(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  function dismiss(permanent = false) {
    setOpen(false);
    if (permanent && typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') dismiss(true);
    else dismiss(false);
    setDeferred(null);
  }

  if (!mounted || !open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto flex w-full max-w-md justify-center px-4">
      <div
        className={cn(
          'border-border bg-background pointer-events-auto w-full rounded-xl border p-4 shadow-lg',
          'value-fade',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="bg-foreground/5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Zainstaluj jako aplikację</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {showIos
                ? 'Dodaj do ekranu początkowego, żeby działała jak natywna apka.'
                : 'Szybsze ładowanie, działa offline.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Zamknij"
            onClick={() => dismiss(true)}
            className="text-muted-foreground hover:text-foreground -m-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIos ? (
          <div className="mt-3 space-y-1.5 rounded-lg bg-muted/40 p-3">
            <Step n={1}>
              <span>Stuknij</span>
              <Share className="text-foreground inline-block h-3.5 w-3.5" strokeWidth={2} />
              <span>na dole Safari</span>
            </Step>
            <Step n={2}>
              <span>Wybierz</span>
              <span className="border-border inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                <Plus className="h-2.5 w-2.5" />
                Dodaj do ekranu początkowego
              </span>
            </Step>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => dismiss(true)}>
              Nie teraz
            </Button>
            <Button size="sm" className="flex-1" onClick={install}>
              Zainstaluj
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="bg-foreground text-background inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
        {n}
      </span>
      {children}
    </p>
  );
}
