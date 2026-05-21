'use client';

import { useState, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { NotificationItem } from './NotificationItem';
import { SkeletonList } from '@/presentation/shared/components/data-display/Skeleton';
import { InboxFilterBar } from './InboxFilterBar';
import { InboxMessageList } from './InboxMessageList';
import { InboxEmptyState } from './InboxEmptyState';

interface Props {
  includeRead?: boolean;
  sourceFilter?: 'SYSTEM' | 'USER';
}

export function NotificationInbox({ includeRead = false, sourceFilter }: Props) {
  const { data: allNotifications = [], isLoading } = useNotifications(includeRead);
  const { markOne, markAll, deleteOne, deleteMany } = useNotificationActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const notifications = sourceFilter
    ? allNotifications.filter((n) => n.source === sourceFilter)
    : allNotifications;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  const handleMarkSelected = () => {
    const ids = [...selected].filter((id) => notifications.find((n) => n.id === id && !n.read));
    Promise.all(ids.map((id) => markOne.mutate(id)));
    clearSelection();
  };

  const handleDeleteSelected = () => {
    deleteMany.mutate([...selected], { onSuccess: clearSelection });
  };

  if (isLoading) return <SkeletonList count={5} />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col">
      <InboxFilterBar
        selectedCount={selected.size}
        unreadCount={unreadCount}
        onMarkSelected={handleMarkSelected}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={clearSelection}
        onMarkAll={() => markAll.mutate()}
        deleteManyPending={deleteMany.isPending}
        markAllPending={markAll.isPending}
      />

      {notifications.length === 0 ? (
        <InboxEmptyState sourceFilter={sourceFilter} />
      ) : (
        <InboxMessageList>
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              isSelected={selected.has(n.id)}
              onToggleSelect={() => toggle(n.id)}
              onMarkRead={() => markOne.mutate(n.id)}
              onDelete={() => deleteOne.mutate(n.id)}
            />
          ))}
        </InboxMessageList>
      )}
    </div>
  );
}
