'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogo } from '@/components/GoogleLogo';
import { AppleLogo } from '@/components/AppleLogo';
import { useAuthAvailability } from '@/hooks/useAuthAvailability';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') ?? '/';
  const availability = useAuthAvailability();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Nie udało się utworzyć konta');
        setSubmitting(false);
        return;
      }
      const signin = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (signin?.error) {
        router.replace('/login');
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('Nie udało się utworzyć konta. Spróbuj ponownie.');
      setSubmitting(false);
    }
  }

  function googleSignIn() {
    void signIn('google', { callbackUrl });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
      <div className="mb-8 text-center">
        <div className="bg-foreground text-background mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold">
          k
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Stwórz konto</h1>
        <p className="text-muted-foreground mt-1 text-sm">Zacznij liczyć kalorie w 30 sekund</p>
      </div>

      <div className="space-y-2">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={googleSignIn}
          disabled={submitting}
        >
          <GoogleLogo className="h-4 w-4" />
          Kontynuuj przez Google
        </Button>
        {availability.apple && (
          <Button
            size="lg"
            className="w-full bg-black text-white hover:bg-black/90"
            onClick={() => void signIn('apple', { callbackUrl })}
            disabled={submitting}
          >
            <AppleLogo className="h-4 w-4" />
            Kontynuuj przez Apple
          </Button>
        )}
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">lub email</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Imię (opcjonalne)</Label>
          <Input
            id="name"
            type="text"
            autoComplete="given-name"
            placeholder="Jak się nazywasz?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="ty@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 znaków"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-[hsl(0_84%_60%)]/30 bg-[hsl(0_84%_60%)]/5 px-3 py-2 text-center text-xs text-[hsl(0_70%_45%)]">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={submitting || !email || password.length < 8}
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? 'Tworzę konto...' : 'Załóż konto'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Masz już konto?{' '}
        <Link
          href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
