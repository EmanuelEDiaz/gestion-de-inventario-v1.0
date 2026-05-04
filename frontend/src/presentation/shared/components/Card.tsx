/**
 * Card - Reusable card container
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  inactive?: boolean;
}

export function Card({ children, className = '', inactive = false }: CardProps) {
  return (
    <div
      className={`rounded-lg bg-white p-6 shadow ${inactive ? 'opacity-60' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export function CardHeader({ title, subtitle, badge }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {badge}
    </div>
  );
}
