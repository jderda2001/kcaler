import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-muted relative overflow-hidden rounded-md skeleton-shimmer', className)} {...props} />;
}
