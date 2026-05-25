'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleFavorite } from '@/lib/db';

interface Props {
  foodId: string;
  isFavorite: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function FavoriteButton({ foodId, isFavorite, size = 'sm', className }: Props) {
  const [pop, setPop] = useState(false);

  function handle(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!isFavorite) {
      setPop(true);
      window.setTimeout(() => setPop(false), 400);
    }
    toggleFavorite(foodId);
  }

  const iconClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonClass = size === 'md' ? 'h-10 w-10' : 'h-9 w-9';

  return (
    <button
      type="button"
      aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      onClick={handle}
      className={cn(
        'hover:bg-muted flex items-center justify-center rounded-lg transition-colors',
        buttonClass,
        className,
      )}
    >
      <Star
        className={cn(
          iconClass,
          'transition-colors',
          isFavorite
            ? 'fill-[hsl(38_92%_50%)] text-[hsl(38_92%_50%)]'
            : 'text-muted-foreground',
          pop && 'star-pop',
        )}
      />
    </button>
  );
}
