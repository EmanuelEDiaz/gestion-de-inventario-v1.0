'use client';

import { useState, useEffect, useRef } from 'react';
import type { Customer } from '@/core/customer/entities/customer';
import { CustomerRepository } from '@/infrastructure/repositories/customer/CustomerRepository';
import { CustomerSearchInput } from './CustomerSearchInput';
import { CustomerResultList } from './CustomerResultList';
import { CustomerSelectedBadge } from './CustomerSelectedBadge';

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
    return <CustomerSelectedBadge name={value.name} onClear={clear} />;
  }

  return (
    <div ref={ref} className="relative">
      <CustomerSearchInput value={query} onChange={setQuery} disabled={disabled} loading={loading} />
      {open && results.length > 0 && (
        <CustomerResultList results={results} onSelect={select} />
      )}
    </div>
  );
}
