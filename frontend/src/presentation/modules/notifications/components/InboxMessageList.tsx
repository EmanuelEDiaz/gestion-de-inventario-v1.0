'use client';
import type { ReactNode } from 'react';

interface InboxMessageListProps {
  children: ReactNode;
}

export function InboxMessageList({ children }: InboxMessageListProps) {
  return <div className="divide-y divide-gray-100">{children}</div>;
}
