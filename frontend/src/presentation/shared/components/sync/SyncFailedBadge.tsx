'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/presentation/shared/components/ui/badge';
import { TooltipWrapper } from '@/presentation/shared/components/ui';
import { getFailedOutbox } from '@/infrastructure/storage/outbox';
import { RepairDialog } from './RepairDialog';

export function SyncFailedBadge() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    try {
      const entries = await getFailedOutbox();
      setCount(entries.length);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <>
      <TooltipWrapper content={`${count} entradas requieren reparación`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center"
        >
          <Badge variant="destructive" className="cursor-pointer">
            {count}
          </Badge>
        </button>
      </TooltipWrapper>
      {open && <RepairDialog open={open} onClose={() => { setOpen(false); refresh(); }} />}
    </>
  );
}
