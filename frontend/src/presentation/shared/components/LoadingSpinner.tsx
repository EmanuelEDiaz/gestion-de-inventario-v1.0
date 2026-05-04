
import { Icon } from '@iconify/react';
import { cn } from '@/presentation/shared/lib/utils';

const sizeMap = { sm: 16, md: 24, lg: 36 };

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Icon
      icon="svg-spinners:bars-scale-middle"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={cn('text-current', className)}
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
        <LoadingSpinner size="lg" className="text-blue-600" />
        {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
      </div>
    </div>
  );
}


