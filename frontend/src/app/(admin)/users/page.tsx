'use client';

import { UsersView } from '@/presentation/modules/users';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <UsersView />
    </div>
  );
}
