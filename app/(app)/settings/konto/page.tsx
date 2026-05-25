'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check } from 'lucide-react';
import { SyncStatusCard } from '@/components/SyncStatusCard';

export default function KontoPage() {
  const { data: session } = useSession();
  const user = session?.user;

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
        <h1 className="text-2xl font-semibold tracking-tight">Konto</h1>
      </header>

      <div className="space-y-3">
        <Row label="Email" value={user?.email ?? '—'} verified />
        <Row label="Imię" value={user?.name ?? '—'} />
        <Row label="ID konta" value={user?.id ?? '—'} mono />
      </div>

      <SyncStatusCard />

      <p className="text-muted-foreground text-xs">
        Zmiana emaila i hasła pojawi się w przyszłej wersji.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  verified,
  mono,
}: {
  label: string;
  value: string;
  verified?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="border-border bg-background flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className={`mt-0.5 text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      </div>
      {verified && (
        <span className="text-[hsl(142_70%_45%)] flex items-center gap-1 text-xs">
          <Check className="h-3 w-3" />
          Aktywny
        </span>
      )}
    </div>
  );
}
