'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { FoodList } from '@/components/FoodList';
import { LogQuantitySheet } from '@/components/LogQuantitySheet';
import { AddFoodForm } from '@/components/AddFoodForm';
import { ConfidenceBadge, LabelScanner } from '@/components/LabelScanner';
import { getProfile } from '@/lib/db';
import type { Food, MealType } from '@/types';
import type { AddFoodInitialValues } from '@/components/AddFoodForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMeal?: MealType;
  /** Date in 'YYYY-MM-DD' format. Defaults to today. */
  date?: string;
  onLogged?: () => void;
}

type SubFlow =
  | { kind: 'none' }
  | { kind: 'scan' }
  | {
      kind: 'form';
      initial?: AddFoodInitialValues;
      confidence?: 'high' | 'medium' | 'low';
    };

export function FoodSearchSheet({ open, onOpenChange, initialMeal, date, onLogged }: Props) {
  const [picked, setPicked] = useState<Food | null>(null);
  const [warnHighSugar, setWarnHighSugar] = useState(false);
  const [sub, setSub] = useState<SubFlow>({ kind: 'none' });

  useEffect(() => {
    if (open) getProfile().then((p) => setWarnHighSugar(Boolean(p?.warn_high_sugar)));
    if (!open) setSub({ kind: 'none' });
  }, [open]);

  const showList = open && !picked && sub.kind === 'none';

  return (
    <>
      <Sheet open={showList} onOpenChange={onOpenChange}>
        <SheetContent side="full" className="flex flex-col p-0">
          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <SheetTitle>Dodaj jedzenie</SheetTitle>
            <SheetDescription className="sr-only">
              Wyszukaj produkt z bazy lub dodaj własny.
            </SheetDescription>
          </div>
          <div className="flex-1 overflow-hidden">
            <FoodList
              autoFocus
              onPickFood={setPicked}
              onScan={() => setSub({ kind: 'scan' })}
              onAddCustom={() => setSub({ kind: 'form' })}
              showActions
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={open && sub.kind === 'scan'}
        onOpenChange={(o) => {
          if (!o) setSub({ kind: 'none' });
        }}
      >
        <SheetContent side="full" className="flex flex-col p-0">
          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <SheetTitle>Skanuj etykietę</SheetTitle>
            <SheetDescription className="sr-only">
              Zrób zdjęcie etykiety, a wartości zostaną wczytane automatycznie.
            </SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LabelScanner
              onCancel={() => setSub({ kind: 'none' })}
              onScanned={(initial, confidence) => setSub({ kind: 'form', initial, confidence })}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={open && sub.kind === 'form'}
        onOpenChange={(o) => {
          if (!o) setSub({ kind: 'none' });
        }}
      >
        <SheetContent side="full" className="flex flex-col p-0">
          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <SheetTitle>{sub.kind === 'form' && sub.confidence ? 'Sprawdź wartości' : 'Dodaj własny produkt'}</SheetTitle>
            <SheetDescription className="sr-only">
              Wypełnij wartości odżywcze na 100 g lub 100 ml.
            </SheetDescription>
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
        onOpenChange={(o) => {
          if (!o) setPicked(null);
        }}
        initialMeal={initialMeal}
        date={date}
        warnHighSugar={warnHighSugar}
        onSaved={() => {
          setPicked(null);
          onOpenChange(false);
          onLogged?.();
        }}
      />
    </>
  );
}
