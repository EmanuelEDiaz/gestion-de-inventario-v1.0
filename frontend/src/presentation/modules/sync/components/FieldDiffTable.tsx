'use client';

export type FieldResolution =
  | { action: 'use-server' }
  | { action: 'use-client' }
  | { action: 'merge'; mergedPayload: Record<string, unknown> }
  | { action: 'delete-local' };

interface FieldDiffTableProps {
  serverPayload: Record<string, unknown> | null;
  clientPayload: Record<string, unknown> | null;
  errorCode?: string;
  errorMessage?: string;
  onResolve: (resolution: FieldResolution) => void;
}

function getDiffRows(server: Record<string, unknown>, client: Record<string, unknown>): Array<{
  field: string;
  clientValue: string;
  serverValue: string;
}> {
  const allKeys = new Set([...Object.keys(server), ...Object.keys(client)]);
  const rows: Array<{ field: string; clientValue: string; serverValue: string }> = [];

  for (const key of allKeys) {
    if (key === 'cachedAt' || key === 'version') continue;
    const sv = JSON.stringify(server[key]);
    const cv = JSON.stringify(client[key]);
    if (sv !== cv) {
      rows.push({ field: key, clientValue: cv, serverValue: sv });
    }
  }

  return rows;
}

export function FieldDiffTable({ serverPayload, clientPayload, errorCode, errorMessage, onResolve }: FieldDiffTableProps) {
  if (!serverPayload) {
    if (errorCode === 'NOT_FOUND') {
      return (
        <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 font-medium">
            El registro fue eliminado en el servidor
          </p>
          <p className="text-sm text-yellow-700">
            El registro que intentas actualizar ya no existe en el servidor.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onResolve({ action: 'use-client' })}
              className="min-h-11 px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              title="Conservar el registro localmente"
            >
              Conservar local
            </button>
            <button
              onClick={() => onResolve({ action: 'delete-local' })}
              className="min-h-11 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              title="Eliminar el registro local"
            >
              Eliminar local
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50 border rounded">
        <p className="text-sm text-gray-700 font-medium">Error de sincronización</p>
        {errorMessage && <p className="text-sm text-gray-600 mt-1">{errorMessage}</p>}
      </div>
    );
  }

  if (!clientPayload) {
    return (
      <div className="p-4 bg-gray-50 border rounded">
        <p className="text-sm text-gray-700">No hay datos locales para comparar.</p>
      </div>
    );
  }

  const diffRows = getDiffRows(serverPayload, clientPayload);

  if (diffRows.length === 0) {
    return (
      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800 font-medium">
          El registro fue actualizado pero no hay cambios visibles. ¿Sobrescribir?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onResolve({ action: 'use-server' })}
            className="min-h-11 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Sobrescribir con datos del servidor"
          >
            Usar servidor
          </button>
          <button
            onClick={() => onResolve({ action: 'use-client' })}
            className="min-h-11 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            title="Mantener datos locales"
          >
            Mantener local
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Campo</th>
              <th className="px-3 py-2 text-left font-medium text-red-700">Valor local (tuyo)</th>
              <th className="px-3 py-2 text-left font-medium text-green-700">Valor servidor (otro)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            {diffRows.map((row) => (
              <tr key={row.field} className="border-t border-gray-200">
                <td className="px-3 py-2 font-medium text-gray-800">{row.field}</td>
                <td className="px-3 py-2 text-red-600 bg-red-50">{row.clientValue}</td>
                <td className="px-3 py-2 text-green-600 bg-green-50">{row.serverValue}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const merged: Record<string, unknown> = { ...clientPayload };
                        merged[row.field] = JSON.parse(row.clientValue);
                        onResolve({ action: 'merge', mergedPayload: merged });
                      }}
                      className="min-h-11 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Usar mi valor local para este campo"
                    >
                      Usar el mío
                    </button>
                    <button
                      onClick={() => {
                        const merged: Record<string, unknown> = { ...clientPayload };
                        merged[row.field] = JSON.parse(row.serverValue);
                        onResolve({ action: 'merge', mergedPayload: merged });
                      }}
                      className="min-h-11 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Usar el valor del servidor para este campo"
                    >
                      Usar del servidor
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onResolve({ action: 'use-server' })}
          className="min-h-11 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          title="Usar todos los datos del servidor"
        >
          Usar todo del servidor
        </button>
        <button
          onClick={() => onResolve({ action: 'use-client' })}
          className="min-h-11 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          title="Conservar todos mis datos locales"
        >
          Mantener todo local
        </button>
      </div>
    </div>
  );
}
