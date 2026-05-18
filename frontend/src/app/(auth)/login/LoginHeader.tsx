export function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Sistema de Inventario</h1>
      <p className="text-gray-600 mt-1">Inicia sesión para continuar</p>
    </div>
  );
}
