'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Camera, PenLine, X } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn } from '@/lib/utils';
import { db, getFavoriteFoods, getRecentFoods, searchFoods } from '@/lib/db';
import { CATEGORY_COLOR } from '@/lib/categories';
import { T } from '@/lib/i18n';
import type { Food } from '@/types';

interface Props {
  onPickFood: (food: Food) => void;
  onScan?: () => void;
  onAddCustom?: () => void;
  onEscape?: () => void;
  showActions?: boolean;
  autoFocus?: boolean;
}

type ListTab = 'recent' | 'favorites' | 'all';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function FoodList({
  onPickFood,
  onScan,
  onAddCustom,
  onEscape,
  showActions = true,
  autoFocus,
}: Props) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ListTab>('recent');

  const all = useLiveQuery(() => db.foods.toArray(), []);
  const [recent, setRecent] = useState<Food[]>([]);
  const [favs, setFavs] = useState<Food[]>([]);

  useEffect(() => {
    getRecentFoods(30).then(setRecent);
    getFavoriteFoods().then(setFavs);
  }, [all]);

  const [searchResults, setSearchResults] = useState<Food[]>([]);
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    let alive = true;
    searchFoods(query, 60).then((r) => {
      if (alive) setSearchResults(r);
    });
    return () => {
      alive = false;
    };
  }, [query, all]);

  const visibleList = useMemo<Food[]>(() => {
    if (query.trim()) return searchResults;
    if (tab === 'recent') return recent.length > 0 ? recent : (all ?? []).slice(0, 30);
    if (tab === 'favorites') return favs;
    return (all ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [query, searchResults, tab, recent, favs, all]);

  // Group by first letter for "Wszystkie" tab (when no search)
  const groupedAll = useMemo(() => {
    if (query.trim() || tab !== 'all') return null;
    const groups = new Map<string, Food[]>();
    for (const f of visibleList) {
      const letter = normalize(f.name)[0]?.toUpperCase() ?? '#';
      const key = /[A-Z]/.test(letter) ? letter : '#';
      const arr = groups.get(key) ?? [];
      arr.push(f);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [query, tab, visibleList]);

  return (
    <div className="flex h-full flex-col">
      <div className="bg-background sticky top-0 z-10 space-y-3 px-4 pb-3 pt-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            autoFocus={autoFocus}
            placeholder={T.search_placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation();
                setQuery('');
              }
            }}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              aria-label="Wyczyść"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showActions && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onScan}
              className="border-border hover:bg-muted hover:border-foreground/30 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]"
            >
              <Camera className="h-4 w-4" />
              {T.scan_label}
            </button>
            <button
              type="button"
              onClick={onAddCustom}
              className="border-border hover:bg-muted hover:border-foreground/30 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4" />
              {T.add_custom}
            </button>
          </div>
        )}

        {!query.trim() && (
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as ListTab)}>
            <Tabs.List className="border-border bg-muted/40 grid grid-cols-3 gap-1 rounded-xl border p-1">
              {[
                { v: 'recent', l: T.recent },
                { v: 'favorites', l: T.favorites },
                { v: 'all', l: T.all },
              ].map((o) => (
                <Tabs.Trigger
                  key={o.v}
                  value={o.v}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_0_1px_rgba(0,0,0,0.04)]',
                    'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {o.l}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {all === undefined ? (
          <ul className="divide-border divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2 py-3">
                <Skeleton className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-5 rounded" />
              </li>
            ))}
          </ul>
        ) : visibleList.length === 0 ? (
          <EmptyState query={query} tab={tab} />
        ) : groupedAll ? (
          <div>
            {groupedAll.map(([letter, foods]) => (
              <div key={letter}>
                <div className="bg-background/95 sticky top-0 z-[5] -mx-4 border-b border-border/60 px-4 py-1.5 backdrop-blur">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                    {letter}
                  </span>
                </div>
                <ul className="divide-border divide-y">
                  {foods.map((f) => (
                    <FoodRow key={f.id} food={f} onPick={onPickFood} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {visibleList.map((f) => (
              <FoodRow key={f.id} food={f} onPick={onPickFood} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FoodRow({ food, onPick }: { food: Food; onPick: (f: Food) => void }) {
  return (
    <li className="flex items-center gap-2 py-3">
      <span
        aria-hidden
        className="ml-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR[food.category] }}
      />
      <button
        type="button"
        onClick={() => onPick(food)}
        className="flex flex-1 items-center justify-between gap-3 text-left active:opacity-70"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{food.name}</div>
          <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
            {Math.round(food.kcal)} kcal · 100{food.unit}
          </div>
        </div>
      </button>
      <FavoriteButton foodId={food.id} isFavorite={food.is_favorite} />
    </li>
  );
}

function EmptyState({ query, tab }: { query: string; tab: ListTab }) {
  if (query.trim()) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">Nic nie znaleziono</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Sprawdź pisownię lub dodaj własny produkt.
        </p>
      </div>
    );
  }
  if (tab === 'favorites') {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">Brak ulubionych</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Kliknij gwiazdkę przy produkcie, żeby tu trafił.
        </p>
      </div>
    );
  }
  if (tab === 'recent') {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">Brak ostatnich</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Tu pojawią się produkty, których ostatnio używałeś.
        </p>
      </div>
    );
  }
  return null;
}
