'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function SidebarTooltip({ label, description, children }: SidebarTooltipProps) {
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
            <span className="absolute right-full top-1/2 block h-0 w-0 -translate-y-1/2"
              style={{ borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid #111827' }}
              aria-hidden />
            <p className="text-xs font-semibold leading-tight text-white">{label}</p>
            {description && <p className="mt-1 text-[11px] leading-snug text-gray-400">{description}</p>}
          </div>,
          document.body
        )}
    </div>
  );
}
