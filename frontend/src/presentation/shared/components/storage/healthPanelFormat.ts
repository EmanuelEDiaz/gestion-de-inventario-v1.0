export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  const value = bytes / Math.pow(1000, exponent);
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-CU').format(n);
}

export function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('es-CU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString();
  }
}
