'use client';

interface InboxEmptyStateProps {
  sourceFilter?: string;
}

export function InboxEmptyState({ sourceFilter }: InboxEmptyStateProps) {
  return (
    <div className="py-12 text-center text-gray-400 text-sm">
      {sourceFilter === 'USER' ? 'Sin mensajes recibidos' : 'Sin notificaciones'}
    </div>
  );
}
