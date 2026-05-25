'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastCtx {
  toast: (message: string, opts?: { type?: Toast['type']; duration?: number }) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastCtx['toast']>((message, opts) => {
    const id = crypto.randomUUID();
    const t: Toast = { id, message, type: opts?.type ?? 'success' };
    setItems((arr) => [...arr, t]);
    const dur = opts?.duration ?? 2200;
    setTimeout(() => dismiss(id), dur);
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto flex w-full max-w-md flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const Icon = toast.type === 'error' ? X : Check;
  const accent =
    toast.type === 'error'
      ? 'bg-[hsl(0_84%_60%)]'
      : toast.type === 'info'
        ? 'bg-foreground/80'
        : 'bg-[hsl(142_70%_45%)]';

  return (
    <button
      type="button"
      onClick={onDismiss}
      className={`pointer-events-auto border-border bg-foreground text-background flex max-w-full items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-lg transition-all duration-200 ease-out ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}`}
    >
      <span className={`${accent} flex h-5 w-5 items-center justify-center rounded-full`}>
        <Icon className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
      <span className="pr-1">{toast.message}</span>
    </button>
  );
}
