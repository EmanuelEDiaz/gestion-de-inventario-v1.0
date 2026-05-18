export const statusColors = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted/10 text-muted-foreground border-muted/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-info/10 text-info border-info/30',
} as const;

export function statusBadge(active: boolean): string {
  return active ? statusColors.active : statusColors.inactive;
}
