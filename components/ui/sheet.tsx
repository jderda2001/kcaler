'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'bottom' | 'full';
  showClose?: boolean;
  onDismiss?: () => void;
}

const DISMISS_THRESHOLD_PX = 120;
const DISMISS_VELOCITY = 0.6; // px / ms

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = 'bottom', showClose = true, onDismiss, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const startRef = React.useRef<{ y: number; t: number } | null>(null);
  const lastRef = React.useRef<{ y: number; t: number } | null>(null);

  const draggable = side === 'bottom';

  function onTouchStart(e: React.TouchEvent) {
    if (!draggable) return;
    const t = e.touches[0];
    startRef.current = { y: t.clientY, t: Date.now() };
    lastRef.current = { y: t.clientY, t: Date.now() };
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!draggable || !startRef.current) return;
    const t = e.touches[0];
    const dy = t.clientY - startRef.current.y;
    if (dy > 0) {
      setDragY(dy);
      lastRef.current = { y: t.clientY, t: Date.now() };
    } else {
      setDragY(0);
    }
  }

  function onTouchEnd() {
    if (!draggable) return;
    setDragging(false);
    if (!startRef.current || !lastRef.current) {
      setDragY(0);
      return;
    }
    const dy = lastRef.current.y - startRef.current.y;
    const dt = Math.max(1, lastRef.current.t - startRef.current.t);
    const v = dy / dt;
    const shouldClose = dy > DISMISS_THRESHOLD_PX || v > DISMISS_VELOCITY;
    startRef.current = null;
    lastRef.current = null;
    if (shouldClose && onDismiss) {
      onDismiss();
      setTimeout(() => setDragY(0), 300);
    } else {
      setDragY(0);
    }
  }

  const fullHeightStyle: React.CSSProperties =
    side === 'full' ? { height: 'var(--vvh, 100dvh)' } : {};

  const transformStyle: React.CSSProperties = draggable && dragY > 0
    ? {
        transform: `translate(-50%, ${dragY}px)`,
        transition: dragging ? 'none' : 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    : {};

  const mergedStyle = { ...fullHeightStyle, ...transformStyle };

  return (
    <SheetPortal>
      <SheetOverlay style={dragY > 0 ? { opacity: Math.max(0.2, 1 - dragY / 300) } : undefined} />
      <DialogPrimitive.Content
        ref={innerRef}
        className={cn(
          'bg-background fixed left-1/2 z-50 w-full max-w-md -translate-x-1/2 outline-none',
          side === 'bottom' &&
            'bottom-0 rounded-t-2xl border-t border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-300',
          side === 'full' &&
            'top-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-300',
          className,
        )}
        style={mergedStyle}
        {...props}
      >
        {side === 'bottom' && (
          <div
            className="touch-pan-x flex justify-center pt-2 pb-1"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
          >
            <div className="bg-border h-1.5 w-12 rounded-full" />
          </div>
        )}
        {children}
        {showClose && side === 'full' && (
          <DialogPrimitive.Close
            className="hover:bg-muted absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold tracking-tight', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';
