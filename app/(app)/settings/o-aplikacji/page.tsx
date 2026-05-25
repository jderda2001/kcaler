'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">O aplikacji</h1>
      </header>

      <div className="border-border bg-background flex flex-col items-center gap-3 rounded-xl border p-6">
        <div className="bg-foreground text-background flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold">
          k
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">Kcal Tracker</p>
          <p className="text-muted-foreground text-xs">Wersja 0.1.0 — Beta</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          Liczenie kalorii i makro — szybko, po polsku, offline. Skanowanie etykiet przez AI.
          Zbudowane z myślą o minimum klikania.
        </p>
      </div>
    </div>
  );
}
