'use client';

import { useState, useRef, useEffect } from 'react';
import type { PaymentMode } from '@/core/sale/entities/sale';
import { ChevronDown } from 'lucide-react';

interface FiarButtonProps {
  paymentMode: PaymentMode;
  customerName?: string | null;
  hasCustomer: boolean;
  onChange: (mode: PaymentMode) => void;
}

const MODES: { value: PaymentMode; label: string; description: string }[] = [
  { value: 'IMMEDIATE', label: 'Cobrar ahora', description: 'Pago inmediato' },
  { value: 'CREDIT', label: 'Fiado (Crédito)', description: 'Genera deuda al cliente' },
  { value: 'RESERVE', label: 'Reserva', description: 'Reserva stock sin cobrar' },
];

export function FiarButton({ paymentMode, customerName, hasCustomer, onChange }: FiarButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = MODES.find((m) => m.value === paymentMode) ?? MODES[0];
  const isFiar = paymentMode === 'CREDIT' || paymentMode === 'RESERVE';

  const buttonLabel = isFiar && hasCustomer && customerName
    ? `FIAR a ${customerName}`
    : isFiar && !hasCustomer
    ? 'FIAR (sin cliente)'
    : current.label;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
        title="Cambiar modo de pago: Cobrar ahora, Fiado (Crédito) o Reserva"
      >
        {buttonLabel}
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-52 rounded-lg border bg-white shadow-lg z-50">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => { onChange(m.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                paymentMode === m.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
              title={m.description}
            >
              <span className="block font-medium">{m.label}</span>
              <span className="block text-xs text-gray-400">{m.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
