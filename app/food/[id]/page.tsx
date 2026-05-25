'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { db, deleteCustomFood, getFood, toggleFavorite } from '@/lib/db';
import { formatGrams, formatKcal, netCarbs } from '@/lib/macros';
import { cn } from '@/lib/utils';
import type { Food, LogEntry } from '@/types';

export default function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    getFood(id).then((f) => {
      if (!alive) return;
      if (!f) router.replace('/');
      else setFood(f);
    });
    return () => {
      alive = false;
    };
  }, [id, router]);

  const liveFood = useLiveQuery(() => db.foods.get(id), [id]);
  const f = liveFood ?? food;

  const entries = useLiveQuery(
    () =>
      db.logs
        .where('food_id')
        .equals(id)
        .reverse()
        .limit(20)
        .toArray()
        .then((arr) => arr.sort((a, b) => b.created_at - a.created_at)),
    [id],
  );

  async function handleDelete() {
    await deleteCustomFood(id);
    router.replace('/');
  }

  if (!f) return null;

  return (
    <div className="min-h-dvh pb-6">
      <header className="bg-background/90 border-border sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-2 backdrop-blur">
        <button
          type="button"
          aria-label="Wstecz"
          onClick={() => router.back()}
          className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="line-clamp-1 flex-1 text-base font-semibold">{f.name}</h1>
        <button
          type="button"
          aria-label={f.is_favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          onClick={() => toggleFavorite(id)}
          className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        >
          <Star
            className={cn(
              'h-5 w-5',
              f.is_favorite
                ? 'fill-[hsl(38_92%_50%)] text-[hsl(38_92%_50%)]'
                : 'text-muted-foreground',
            )}
          />
        </button>
      </header>

      <div className="space-y-6 px-4 pt-6">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {f.is_custom ? 'Twój produkt' : 'Z bazy'}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{f.name}</h2>
          <p className="text-muted-foreground mt-1 text-sm">Wartości na 100 {f.unit}</p>
        </div>

        <div className="border-border bg-background rounded-xl border">
          <div className="border-border border-b p-4">
            <p className="text-3xl font-semibold tabular-nums">
              {formatKcal(f.kcal)}
              <span className="text-muted-foreground ml-2 text-base font-normal">kcal</span>
            </p>
          </div>
          <dl className="divide-border divide-y">
            <Row label="Tłuszcz" value={`${formatGrams(f.fat)} g`} />
            {f.saturated_fat !== null && f.saturated_fat !== undefined && (
              <Row label="W tym nasycone" value={`${formatGrams(f.saturated_fat)} g`} indent />
            )}
            <Row label="Białko" value={`${formatGrams(f.protein)} g`} />
            <Row label="Węglowodany" value={`${formatGrams(f.carbs)} g`} />
            {f.sugars !== null && f.sugars !== undefined && (
              <Row label="W tym cukry" value={`${formatGrams(f.sugars)} g`} indent />
            )}
            <Row label="Błonnik" value={`${formatGrams(f.fiber)} g`} />
            <Row
              label="Węglowodany netto"
              value={`${formatGrams(netCarbs(f))} g`}
              muted
            />
            {f.salt !== null && f.salt !== undefined && (
              <Row label="Sól" value={`${formatGrams(f.salt)} g`} />
            )}
          </dl>
        </div>

        {entries && entries.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
              Ostatnie wpisy
            </h3>
            <div className="border-border bg-background overflow-hidden rounded-xl border">
              <ul className="divide-border divide-y">
                {entries.map((e: LogEntry) => (
                  <li key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm">{formatRelative(e.date)}</p>
                      <p className="text-muted-foreground text-xs">
                        {mealLabel(e.meal)} · {e.quantity}
                        {f.unit}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatKcal((f.kcal * e.quantity) / 100)} kcal
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {f.is_custom && (
          <div className="pt-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full text-[hsl(0_84%_60%)]"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Usuń produkt
            </Button>
          </div>
        )}

        <Link
          href="/"
          className="text-muted-foreground block pt-2 text-center text-xs underline-offset-2 hover:underline"
        >
          Wróć do dashboardu
        </Link>
      </div>

      <Sheet open={confirmDelete} onOpenChange={setConfirmDelete}>
        <SheetContent onDismiss={() => setConfirmDelete(false)}>
          <div className="px-5 pt-2 pb-6">
            <SheetTitle>Usunąć "{f.name}"?</SheetTitle>
            <SheetDescription className="mt-2">
              Produkt zniknie z listy. Wpisy w historii zostaną, ale stracą szczegóły.
            </SheetDescription>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Anuluj
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={handleDelete}>
                Usuń
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({
  label,
  value,
  indent,
  muted,
}: {
  label: string;
  value: string;
  indent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt
        className={cn(
          'text-sm',
          indent && 'text-muted-foreground pl-3 text-xs',
          muted && !indent && 'text-muted-foreground text-xs',
        )}
      >
        {label}
      </dt>
      <dd className={cn('text-sm font-medium tabular-nums', muted && 'text-muted-foreground')}>
        {value}
      </dd>
    </div>
  );
}

function formatRelative(date: string): string {
  const today = new Date();
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - dt.getTime()) / 86400000);
  if (diffDays === 0) return 'Dziś';
  if (diffDays === 1) return 'Wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;
  return dt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
}

function mealLabel(m: string): string {
  return {
    breakfast: 'Śniadanie',
    lunch: 'Obiad',
    dinner: 'Kolacja',
    snack: 'Przekąska',
  }[m] ?? m;
}
