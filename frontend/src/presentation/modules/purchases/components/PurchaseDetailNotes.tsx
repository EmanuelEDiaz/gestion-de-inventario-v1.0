'use client';

interface PurchaseDetailNotesProps {
  notes?: string | null;
}

export function PurchaseDetailNotes({ notes }: PurchaseDetailNotesProps) {
  if (!notes) return null;

  return (
    <div className="mb-6 p-3 bg-muted/50 rounded">
      <p className="text-sm text-muted-foreground">Notas</p>
      <p>{notes}</p>
    </div>
  );
}
