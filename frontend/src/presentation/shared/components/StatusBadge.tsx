/**
 * StatusBadge - Reusable badge for active/inactive status
 */

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({ 
  active, 
  activeLabel = 'Activo', 
  inactiveLabel = 'Inactivo' 
}: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
