import Link from 'next/link';
import { Warning, Home } from '@material-symbols-svg/react';
import { Button } from '@/presentation/shared/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/shared/components/ui/card';

const iconProps = { width: 32, height: 32, className: 'text-yellow-600' };

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full text-center shadow-xl border-0">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Warning {...iconProps} />
          </div>
          <CardTitle className="text-6xl font-bold text-gray-900">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-gray-600">
            ¡Ups! La página que buscas no existe.
          </p>
          <p className="text-sm text-gray-500">
            La página que intentaste acceder no existe o fue movida.
          </p>
          <div className="pt-4">
            <Link href="/" className="block">
              <Button className="w-full gap-2">
                <Home className="h-4 w-4" />
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}