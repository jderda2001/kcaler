'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { clearAllData } from '@/lib/db';

export default function PrivacyPage() {
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);

  async function doClear() {
    await clearAllData();
    router.replace('/onboarding');
  }

  return (
    <div className="space-y-6 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="Wstecz"
          className="hover:bg-muted -ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Prywatność</h1>
      </header>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Lokalne dane
        </h2>
        <p className="text-muted-foreground text-xs">
          Aplikacja trzyma profil, dodane produkty i historię w bazie urządzenia (IndexedDB).
          Synchronizacja z serwerem pojawi się w kolejnej wersji.
        </p>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="border-border hover:bg-muted/40 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors"
        >
          <Trash2 className="text-[hsl(0_84%_60%)] h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Wyczyść lokalne dane</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Usuwa profil, jedzenie i historię z tego urządzenia. Konto pozostaje aktywne.
            </p>
          </div>
        </button>
      </section>

      <Sheet open={confirmClear} onOpenChange={setConfirmClear}>
        <SheetContent onDismiss={() => setConfirmClear(false)}>
          <div className="px-5 pt-2 pb-6">
            <SheetTitle>Wyczyścić lokalne dane?</SheetTitle>
            <SheetDescription className="mt-2">
              Usuniemy profil, dodane produkty, ulubione i całą historię z tego urządzenia.
              Tej operacji nie da się cofnąć.
            </SheetDescription>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmClear(false)}
              >
                Anuluj
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={doClear}>
                Wyczyść
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
