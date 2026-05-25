'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLogo } from '@/components/GoogleLogo';
import { AppleLogo } from '@/components/AppleLogo';
import { useAuthAvailability } from '@/hooks/useAuthAvailability';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') ?? '/';
  const availability = useAuthAvailability();
  const errorParam = search.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'CredentialsSignin'
      ? 'Nieprawidłowy email lub hasło'
      : errorParam
        ? 'Coś poszło nie tak. Spróbuj ponownie.'
        : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Nieprawidłowy email lub hasło');
        setSubmitting(false);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('Nie udało się zalogować. Spróbuj ponownie.');
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
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Witaj z powrotem</h1>
        <p className="text-muted-foreground mt-1 text-sm">Zaloguj się, żeby kontynuować</p>
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-[hsl(0_84%_60%)]/30 bg-[hsl(0_84%_60%)]/5 px-3 py-2 text-center text-xs text-[hsl(0_70%_45%)]">
            {error}
          </p>
        )}

        <Button size="lg" className="w-full" disabled={submitting || !email || !password}>
          <Mail className="h-4 w-4" />
          {submitting ? 'Loguję...' : 'Zaloguj się'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Nie masz konta?{' '}
        <Link
          href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
