'use client';

import { useRef, useState } from 'react';
import { Camera, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FoodCategory, Unit } from '@/types';
import type { AddFoodInitialValues } from '@/components/AddFoodForm';

interface ScanResult {
  name: string;
  unit: Unit;
  per_100: {
    kcal: number;
    fat: number;
    saturated_fat: number | null;
    carbs_total: number;
    sugars: number | null;
    fiber: number | null;
    protein: number;
    salt: number | null;
  };
  confidence: 'high' | 'medium' | 'low';
}

interface Props {
  onScanned: (initial: AddFoodInitialValues, confidence: 'high' | 'medium' | 'low') => void;
  onCancel: () => void;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function downscale(dataUrl: string, maxDim = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function LabelScanner({ onScanned, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    inputRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const original = await fileToDataUrl(file);
      const resized = await downscale(original);
      setPreview(resized);
      setLoading(true);
      const res = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: resized }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ScanResult;
      const guessCategory: FoodCategory = data.unit === 'ml' ? 'napoje' : 'inne';
      const initial: AddFoodInitialValues = {
        name: data.name || '',
        unit: data.unit,
        category: guessCategory,
        kcal: data.per_100.kcal,
        fat: data.per_100.fat,
        protein: data.per_100.protein,
        carbs: data.per_100.carbs_total,
        fiber: data.per_100.fiber ?? 0,
        sugars: data.per_100.sugars,
        saturated_fat: data.per_100.saturated_fat,
        salt: data.per_100.salt,
      };
      onScanned(initial, data.confidence);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col px-4 pb-6 pt-2">
      <div className="flex-1 space-y-4">
        <div className="border-border bg-muted/40 relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <Camera className="text-muted-foreground mx-auto h-10 w-10" strokeWidth={1.5} />
              <p className="text-muted-foreground mt-3 text-sm">
                Zrób zdjęcie etykiety produktu
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Najlepiej kolumny "na 100 g" / "na 100 ml"
              </p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <p className="mt-3 text-sm font-medium text-white">Analizuję etykietę...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-[hsl(0_84%_60%)]/30 bg-[hsl(0_84%_60%)]/5 px-3 py-2 text-sm text-[hsl(0_70%_45%)]">
            {error}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <div className="space-y-2 pt-4">
        <Button size="lg" className={cn('w-full')} onClick={open} disabled={loading}>
          <Camera className="h-4 w-4" />
          {preview ? 'Zrób inne zdjęcie' : 'Zrób zdjęcie'}
        </Button>
        {preview && !loading && (
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setPreview(null)}>
            <RefreshCw className="h-4 w-4" />
            Wyczyść
          </Button>
        )}
        <Button variant="ghost" size="lg" className="w-full" onClick={onCancel} disabled={loading}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high: { label: 'Wysoka pewność', color: 'hsl(142 70% 45%)', bg: 'hsl(142 70% 45% / 0.1)' },
    medium: { label: 'Średnia pewność', color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
    low: { label: 'Niska pewność — sprawdź wartości', color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)' },
  }[confidence];
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </div>
  );
}
