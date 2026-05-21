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
  error: 'bg-danger/5 text-danger border-danger/20',
  success: 'bg-success/5 text-success border-success/20',
  warning: 'bg-warning/5 text-warning border-warning/20',
  info: 'bg-info/5 text-info border-info/20',
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
