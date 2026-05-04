'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExpandCircleDown } from '@material-symbols-svg/react';
import { cn } from '@/presentation/shared/lib/utils';

// ── SidebarTooltip ────────────────────────────────────────────────────────────
// Tooltip mínimo para el sidebar colapsado. Funciona como el atributo `title`
// de HTML: aparece al pasar el cursor, muestra nombre y descripción breve.
// Usa un portal fijo para evitar el clipping del overflow:auto del nav.
// Solo 2 hooks (useState + useRef), sin dependencias externas.

interface SidebarTooltipProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SidebarTooltip({ label, description, children }: SidebarTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top + r.height / 2, left: r.right + 10 });
  }

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-9999 max-w-50 rounded-lg bg-gray-900 px-3 py-2 shadow-xl"
            style={{ top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
          >
            {/* Flecha apuntando hacia la izquierda (hacia el sidebar) */}
            <span
              className="absolute right-full top-1/2 block h-0 w-0 -translate-y-1/2"
              style={{
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '5px solid #111827',
              }}
              aria-hidden
            />
            <p className="text-xs font-semibold leading-tight text-white">{label}</p>
            {description && (
              <p className="mt-1 text-[11px] leading-snug text-gray-400">{description}</p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconOpen?: React.ReactNode;
  items: NavItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <ExpandCircleDown
    width={16}
    height={16}
    className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
  />
);

// ── Componente principal ──────────────────────────────────────────────────────

export function SidebarSection({
  title,
  description,
  icon,
  iconOpen,
  items,
  isOpen,
  isCollapsed,
  onToggle,
}: SidebarSectionProps) {
  const pathname = usePathname();

  const sectionButton = (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white',
        isCollapsed && 'justify-center'
      )}
    >
      {isCollapsed ? (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-800">
          {isOpen && iconOpen
            ? iconOpen
            : icon ?? <span className="text-xs font-bold">{title.charAt(0)}</span>}
        </span>
      ) : (
        <>
          <span className="flex h-6 w-6 items-center justify-center">
            {isOpen && iconOpen ? iconOpen : icon}
          </span>
          <span className="flex-1 text-left">{title}</span>
          <ChevronIcon isOpen={isOpen} />
        </>
      )}
    </button>
  );

  const renderItems = () => (
    <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        const link = (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );

        return (
          <li key={item.href}>
            {isCollapsed ? (
              <SidebarTooltip label={item.label} description={item.description}>
                {link}
              </SidebarTooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <li className="mb-2">
      {isCollapsed ? (
        <SidebarTooltip label={title} description={description}>
          {sectionButton}
        </SidebarTooltip>
      ) : (
        sectionButton
      )}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {renderItems()}
      </div>
    </li>
  );
}

