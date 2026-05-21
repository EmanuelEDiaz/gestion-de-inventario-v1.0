'use client';

interface ScheduleSelectorProps {
  schedule: {
    quietHoursEnabled: boolean;
    quietHoursStartTime: string;
    quietHoursEndTime: string;
    bypassOnCritical: boolean;
  };
  isPending: boolean;
  onToggleQuietHours: (enabled: boolean) => void;
  onUpdateQuietHours: (start: string, end: string) => void;
}

export function ScheduleSelector({ schedule, isPending, onToggleQuietHours, onUpdateQuietHours }: ScheduleSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Horario Silencioso</h3>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={schedule.quietHoursEnabled}
          onChange={() => onToggleQuietHours(!schedule.quietHoursEnabled)}
          disabled={isPending}
          className="h-4 w-4 text-primary rounded disabled:opacity-50"
        />
        <span className="text-sm text-gray-700">Habilitar horario silencioso</span>
      </label>

      {schedule.quietHoursEnabled && (
        <>
          <div className="grid grid-cols-2 gap-3 ml-6">
            <div>
              <label className="text-xs text-gray-600">Desde</label>
              <input
                type="time"
                value={schedule.quietHoursStartTime}
                onChange={(e) => onUpdateQuietHours(e.target.value, schedule.quietHoursEndTime || '')}
                disabled={isPending}
                className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Hasta</label>
              <input
                type="time"
                value={schedule.quietHoursEndTime}
                onChange={(e) => onUpdateQuietHours(schedule.quietHoursStartTime || '', e.target.value)}
                disabled={isPending}
                className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer ml-6">
            <input
              type="checkbox"
              checked={schedule.bypassOnCritical}
              onChange={() => {}}
              disabled={isPending}
              className="h-4 w-4 text-primary rounded disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">Permitir críticas durante horario silencioso</span>
          </label>
        </>
      )}
    </div>
  );
}
