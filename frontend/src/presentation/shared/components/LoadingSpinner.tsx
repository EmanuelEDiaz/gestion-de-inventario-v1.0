interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 36 };

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const px = sizeMap[size];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      role="status"
      aria-label="Cargando"
      className={className}
    >
      <rect width="2.8" height="12" x="1" y="6" fill="currentColor">
        <animate attributeName="y" begin="a0.begin+0.4s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="6;1;6"/>
        <animate attributeName="height" begin="a0.begin+0.4s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="12;22;12"/>
      </rect>
      <rect width="2.8" height="12" x="5.8" y="6" fill="currentColor">
        <animate attributeName="y" begin="a0.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="6;1;6"/>
        <animate attributeName="height" begin="a0.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="12;22;12"/>
      </rect>
      <rect width="2.8" height="12" x="10.6" y="6" fill="currentColor">
        <animate id="a0" attributeName="y" begin="0;a1.end-0.1s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="6;1;6"/>
        <animate attributeName="height" begin="0;a1.end-0.1s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="12;22;12"/>
      </rect>
      <rect width="2.8" height="12" x="15.4" y="6" fill="currentColor">
        <animate attributeName="y" begin="a0.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="6;1;6"/>
        <animate attributeName="height" begin="a0.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="12;22;12"/>
      </rect>
      <rect width="2.8" height="12" x="20.2" y="6" fill="currentColor">
        <animate id="a1" attributeName="y" begin="a0.begin+0.4s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="6;1;6"/>
        <animate attributeName="height" begin="a0.begin+0.4s" calcMode="spline" dur="0.6s" keySplines=".14,.73,.34,1;.65,.26,.82,.45" values="12;22;12"/>
      </rect>
    </svg>
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
      aria-label="Cargando contenido"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 px-8 py-6 shadow-xl ring-1 ring-gray-200/60">
        <LoadingSpinner size="lg" className="text-blue-600" />
        {message && (
          <p className="text-sm font-medium text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
