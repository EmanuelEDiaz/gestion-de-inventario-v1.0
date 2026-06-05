'use client';

import { useState } from 'react';
import { TooltipWrapper } from '@/presentation/shared/components/ui/tooltip';

interface CriticalActionGuardProps {
  children: React.ReactNode;
  actionType: 'confirm-sale' | 'complete-transfer' | 'finalize-adjustment';
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
}

const ACTION_LABELS: Record<string, { hint: string }> = {
  'confirm-sale': { hint: 'Confirmar venta — requiere conexión o consentimiento para encolar offline' },
  'complete-transfer': { hint: 'Completar transferencia — requiere conexión o consentimiento para encolar offline' },
  'finalize-adjustment': { hint: 'Finalizar ajuste — requiere conexión o consentimiento para encolar offline' },
};

export function CriticalActionGuard({ children, actionType, onConfirm, disabled }: CriticalActionGuardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (navigator.onLine) {
      onConfirm();
    } else {
      setShowDialog(true);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
      setShowDialog(false);
    }
  };

  const info = ACTION_LABELS[actionType] || { hint: 'Acción crítica' };

  return (
    <>
      <TooltipWrapper content={info.hint}>
        <div onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          className={disabled ? 'opacity-50 pointer-events-none' : ''}>
          {children}
        </div>
      </TooltipWrapper>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Acción crítica sin conexión</h3>
            <p className="text-sm text-gray-600">
              Esta acción requiere confirmación del servidor para garantizar la integridad del inventario.
              Sin conexión, la operación quedará en estado pendiente hasta que el servidor la valide.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="min-h-11 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                title="Cancelar la operación"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="min-h-11 px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                title="Guardar en cola para sincronizar después"
              >
                {isProcessing ? 'Guardando...' : 'Guardar en cola y continuar offline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
