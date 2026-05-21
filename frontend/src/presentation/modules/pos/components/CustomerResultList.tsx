'use client';

interface CustomerResultListProps {
  results: Array<{ id: string; name: string; code?: string | null }>;
  onSelect: (customer: { id: string; name: string; code?: string | null }) => void;
}

export function CustomerResultList({ results, onSelect }: CustomerResultListProps) {
  return (
    <ul className="absolute left-0 top-full mt-1 w-full rounded-lg border bg-white shadow-lg z-50 max-h-56 overflow-y-auto">
      {results.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
            onClick={() => onSelect(c)}
            title={`Seleccionar a ${c.name}`}
          >
            <span className="font-medium">{c.name}</span>
            {c.code && <span className="ml-2 text-xs text-gray-400">{c.code}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
