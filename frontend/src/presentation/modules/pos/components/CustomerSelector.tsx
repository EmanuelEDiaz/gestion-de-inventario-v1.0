'use client';

import { useState, useEffect, useRef } from 'react';
import type { Customer } from '@/core/customer/entities/customer';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
import { Search, X } from 'lucide-react';

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  disabled?: boolean;
}

const repo = new CustomerRepository();

export function CustomerSelector({ value, onChange, disabled }: CustomerSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await repo.search(query);
        setResults(data.slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const select = (customer: Customer) => {
    onChange(customer);
    setQuery('');
    setOpen(false);
  };

  const clear = () => { onChange(null); setQuery(''); };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-blue-50 text-sm">
        <span className="font-medium text-blue-800 truncate" title={value.name}>{value.name}</span>
        <button
          type="button"
          onClick={clear}
          className="ml-auto shrink-0 text-blue-500 hover:text-blue-700"
          title="Quitar cliente seleccionado"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          className="flex-1 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
          placeholder="Buscar cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          title="Buscar cliente por nombre, código o email"
        />
        {loading && <span className="text-xs text-gray-400">Buscando...</span>}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 w-full rounded-lg border bg-white shadow-lg z-50 max-h-56 overflow-y-auto">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                onClick={() => select(c)}
                title={`Seleccionar a ${c.name}`}
              >
                <span className="font-medium">{c.name}</span>
                {c.code && <span className="ml-2 text-xs text-gray-400">{c.code}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
