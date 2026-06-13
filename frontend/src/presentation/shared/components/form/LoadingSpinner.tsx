
import { cn } from '@/presentation/shared/lib/utils';

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' };

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeMap[size], className)}
      role="status"
      aria-label="Cargando"
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps = {}) {
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm bg-white/30"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 px-8 py-6 shadow-xl ring-1 ring-gray-200/60">
        <LoadingSpinner size="lg" className="text-primary" />
        {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
      </div>
    </div>
  );
}


