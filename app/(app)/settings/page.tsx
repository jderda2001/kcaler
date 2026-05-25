'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ChevronRight, Info, LogOut, Settings2, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { clearAllData } from '@/lib/db';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const user = session?.user;
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  async function handleSignOut() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('kcal:last-user');
        localStorage.removeItem('kcal:last-sync-ms');
        localStorage.removeItem('kcal:sync-status');
      }
      await clearAllData();
    } catch (e) {
      console.warn('logout cleanup failed', e);
    }
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <div className="space-y-6 px-4 pt-6 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
      </header>

      {/* Account card */}
      <div className="border-border bg-background flex items-center gap-3 rounded-xl border p-4">
        <div className="bg-foreground text-background flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name ?? 'Twoje konto'}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user?.email ?? 'Niezalogowany'}
          </p>
        </div>
      </div>

      <SectionGroup>
        <NavLink
          href="/settings/personalizacja"
          icon={Settings2}
          title="Personalizacja"
          description="Profil, cele, makro, plan żywieniowy"
        />
      </SectionGroup>

      <SectionGroup>
        <NavLink
          href="/settings/konto"
          icon={User}
          title="Konto"
          description="Email, dane logowania"
        />
        <NavLink
          href="/settings/prywatnosc"
          icon={ShieldAlert}
          title="Prywatność i dane"
          description="Lokalne dane, eksport, usunięcie konta"
        />
      </SectionGroup>

      <SectionGroup>
        <NavLink
          href="/settings/o-aplikacji"
          icon={Info}
          title="O aplikacji"
          description="Wersja 0.1.0 · Polityka prywatności"
        />
      </SectionGroup>

      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="border-border hover:bg-muted/40 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors active:scale-[0.99]"
      >
        <span className="text-[hsl(0_84%_60%)] bg-[hsl(0_84%_60%)]/10 flex h-9 w-9 items-center justify-center rounded-lg">
          <LogOut className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-[hsl(0_70%_45%)]">Wyloguj się</span>
      </button>

      <Sheet open={confirmLogout} onOpenChange={setConfirmLogout}>
        <SheetContent onDismiss={() => setConfirmLogout(false)}>
          <div className="px-5 pt-2 pb-6">
            <SheetTitle>Wylogować się?</SheetTitle>
            <SheetDescription className="mt-2">
              Twoje dane pozostaną zapisane na koncie. Zalogujesz się ponownie kiedy zechcesz.
            </SheetDescription>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmLogout(false)}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Wyloguj
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SectionGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-background divide-border divide-y overflow-hidden rounded-xl border">
      {children}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/40 flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60"
    >
      <span className="bg-foreground/[0.06] text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{description}</p>
        )}
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </Link>
  );
}
