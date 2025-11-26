// src/app/owner/dashboard/page.tsx

export default function OwnerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Encabezado */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            Panel del propietario
          </h1>
          <p className="text-sm text-slate-500">
            Aquí podrás gestionar tus propiedades y las novedades de tus inmuebles.
          </p>
        </header>

        {/* Acciones principales */}
        <section className="grid gap-4 md:grid-cols-2 mb-10">
          <a
            href="/owner/properties/new"
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Registrar nueva propiedad
            </h2>
            <p className="text-xs text-slate-500">
              Crea un inmueble con dirección, tipo, ubicación y datos del inquilino si ya está
              arrendado.
            </p>
          </a>

          <a
            href="/owner/properties"
            className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Ver mis propiedades
            </h2>
            <p className="text-xs text-slate-500">
              Consulta el listado de tus propiedades y las novedades asociadas.
            </p>
          </a>
        </section>

        {/* Resumen muy simple (placeholder) */}
        <section className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="uppercase tracking-wide text-slate-400 mb-1">Propiedades</p>
            <p className="text-xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-slate-500">
              Luego aquí mostraremos cuántas propiedades tienes registradas.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="uppercase tracking-wide text-slate-400 mb-1">Tickets abiertos</p>
            <p className="text-xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-slate-500">
              Más adelante conectamos las novedades de tus inmuebles.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="uppercase tracking-wide text-slate-400 mb-1">
              Contratos por vencer
            </p>
            <p className="text-xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-slate-500">
              Aquí irán las alertas basadas en fechas de contrato.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
