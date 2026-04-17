import { DashboardLayout } from '@/presentation/shared/components/DashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
