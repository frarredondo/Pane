import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface LiveRegionProps {
  mode?: 'polite' | 'assertive';
  atomic?: boolean;
  visuallyHidden?: boolean;
  className?: string;
  children: ReactNode;
}

export function LiveRegion({
  mode = 'polite',
  atomic = true,
  visuallyHidden = true,
  className,
  children,
}: LiveRegionProps) {
  return (
    <div
      role={mode === 'assertive' ? 'alert' : 'status'}
      aria-live={mode}
      aria-atomic={atomic}
      aria-relevant="additions text"
      className={cn(visuallyHidden && 'sr-only', className)}
    >
      {children}
    </div>
  );
}
