'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/presentation/shared/lib/utils';

interface JsonViewProps {
  data: string | null | undefined;
  maxHeight?: string;
  collapsed?: boolean;
}

function formatJson(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function tokenizeJson(json: string) {
  const tokens: { text: string; className: string }[] = [];
  const regex = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;

  json.replace(regex, (match, key, str, bool, nil, num, offset) => {
    if (offset > lastIndex) {
      tokens.push({ text: json.slice(lastIndex, offset), className: 'text-gray-400' });
    }
    if (key) {
      tokens.push({ text: key, className: 'text-blue-600' });
    } else if (str) {
      tokens.push({ text: str, className: 'text-green-700' });
    } else if (bool) {
      tokens.push({ text: bool, className: 'text-purple-600' });
    } else if (nil) {
      tokens.push({ text: nil, className: 'text-red-400' });
    } else if (num !== undefined) {
      tokens.push({ text: num, className: 'text-orange-600' });
    }
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < json.length) {
    tokens.push({ text: json.slice(lastIndex), className: 'text-gray-400' });
  }

  return tokens;
}

export function JsonView({ data, maxHeight = '240px', collapsed = false }: JsonViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => formatJson(data), [data]);

  if (!formatted) return <span className="text-sm italic text-gray-400">No hay datos</span>;

  const tokens = useMemo(() => tokenizeJson(formatted), [formatted]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = formatted.split('\n').length;
  const isLarge = lineCount > 15;

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5">
        <span className="text-xs text-gray-400">{lineCount} líneas</span>
        <div className="flex gap-1">
          {isLarge && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              {isCollapsed ? 'Expandir' : 'Colapsar'}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
      <pre
        className={cn(
          'overflow-auto p-3 font-mono text-xs leading-relaxed',
          isCollapsed && 'max-h-12 overflow-hidden'
        )}
        style={{ maxHeight: isCollapsed ? undefined : maxHeight }}
      >
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={t.className}>{t.text}</span>
          ))}
        </code>
      </pre>
    </div>
  );
}
