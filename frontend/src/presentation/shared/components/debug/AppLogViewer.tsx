'use client';

import { useState, useEffect, useCallback } from 'react';
import { appLogger } from '@/infrastructure/logging/appLogger';
import type { LogLevel } from '@/infrastructure/logging/appLogger';

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

export function AppLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [logs, setLogs] = useState(appLogger.getLogs());

  const refresh = useCallback(() => {
    setLogs(appLogger.getLogs());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const isDev = process.env.NODE_ENV === 'development';
  const hasDebugParam = typeof window !== 'undefined' && window.location.search.includes('debug=1');

  if (!isDev && !hasDebugParam) return null;

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700"
        aria-label="Toggle debug logs"
        title="Ver logs de depuración"
      >
        <span className="text-sm font-bold">L</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-96 rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
            <span className="text-sm font-medium text-white">App Logs</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-1 border-b border-gray-700 px-2 py-1">
            <button
              onClick={() => setFilter('all')}
              className={`rounded px-2 py-0.5 text-xs ${filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mostrar todos los niveles"
            >
              All
            </button>
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`rounded px-2 py-0.5 text-xs ${filter === level ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={`Filtrar por ${level}`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {filteredLogs.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-500">No hay logs</p>
            )}
            {filteredLogs.slice().reverse().map((entry, i) => (
              <div key={i} className="mb-1 rounded bg-gray-800 px-2 py-1 text-xs">
                <span className={LEVEL_COLORS[entry.level]}>
                  [{entry.level.toUpperCase()}]
                </span>
                <span className="ml-1 text-gray-300">{entry.message}</span>
                {entry.context && (
                  <pre className="mt-0.5 overflow-x-auto text-gray-500">{entry.context}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
