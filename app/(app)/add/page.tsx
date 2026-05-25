'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FoodList } from '@/components/FoodList';
import { LogQuantitySheet } from '@/components/LogQuantitySheet';
import { AddFoodForm } from '@/components/AddFoodForm';
import { ConfidenceBadge, LabelScanner } from '@/components/LabelScanner';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { getProfile } from '@/lib/db';
import type { Food } from '@/types';
import type { AddFoodInitialValues } from '@/components/AddFoodForm';

type SubFlow =
  | { kind: 'none' }
  | { kind: 'scan' }
  | { kind: 'form'; initial?: AddFoodInitialValues; confidence?: 'high' | 'medium' | 'low' };

export default function AddPage() {
  const router = useRouter();
  const [picked, setPicked] = useState<Food | null>(null);
  const [warnHighSugar, setWarnHighSugar] = useState(false);
  const [sub, setSub] = useState<SubFlow>({ kind: 'none' });

  useEffect(() => {
    getProfile().then((p) => setWarnHighSugar(Boolean(p?.warn_high_sugar)));
  }, []);

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dodaj jedzenie</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <FoodList
          autoFocus
          onPickFood={setPicked}
          onScan={() => setSub({ kind: 'scan' })}
          onAddCustom={() => setSub({ kind: 'form' })}
          showActions
        />
      </div>

      <Sheet open={sub.kind === 'scan'} onOpenChange={(o) => !o && setSub({ kind: 'none' })}>
        <SheetContent side="full" className="flex flex-col p-0">
          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <SheetTitle>Skanuj etykietę</SheetTitle>
            <SheetDescription className="sr-only">Zrób zdjęcie etykiety produktu</SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LabelScanner
              onCancel={() => setSub({ kind: 'none' })}
              onScanned={(initial, confidence) => setSub({ kind: 'form', initial, confidence })}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sub.kind === 'form'} onOpenChange={(o) => !o && setSub({ kind: 'none' })}>
        <SheetContent side="full" className="flex flex-col p-0">
          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <SheetTitle>
              {sub.kind === 'form' && sub.confidence ? 'Sprawdź wartości' : 'Dodaj własny produkt'}
            </SheetTitle>
            <SheetDescription className="sr-only">Wartości odżywcze na 100g/ml</SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sub.kind === 'form' && (
              <AddFoodForm
                initial={sub.initial}
                badge={sub.confidence ? <ConfidenceBadge confidence={sub.confidence} /> : null}
                onCancel={() => setSub({ kind: 'none' })}
                onSaved={(food) => {
                  setSub({ kind: 'none' });
                  setPicked(food);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <LogQuantitySheet
        food={picked}
        open={Boolean(picked)}
        onOpenChange={(o) => !o && setPicked(null)}
        warnHighSugar={warnHighSugar}
        onSaved={() => {
          setPicked(null);
          router.push('/');
        }}
      />
    </div>
  );
}
