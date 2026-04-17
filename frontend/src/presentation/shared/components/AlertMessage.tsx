/**
 * AlertMessage - Reusable alert/error/success message
 */

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertMessageProps {
  variant?: AlertVariant;
  message: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-red-50 text-red-600 border-red-200',
  success: 'bg-green-50 text-green-600 border-green-200',
  warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  info: 'bg-blue-50 text-blue-600 border-blue-200',
};

export function AlertMessage({ variant = 'error', message, onDismiss }: AlertMessageProps) {
  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`} role="alert">
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 hover:opacity-70"
            aria-label="Cerrar"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
