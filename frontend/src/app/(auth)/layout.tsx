import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - Inventario',
  description: 'Inicia sesión en el sistema de gestión de inventario',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
