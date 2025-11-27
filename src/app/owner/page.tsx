// src/app/owner/page.tsx
export default function OwnerDashboardPage() {
  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Panel del propietario
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aquí podrás gestionar tus propiedades y las novedades de tus inmuebles.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <a
          href="/owner/properties/new"
          className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Registrar nueva propiedad
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Crea un inmueble con dirección, tipo, ubicación y datos del inquilino si ya está arrendado.
          </p>
        </a>

        <a
          href="/owner/properties"
          className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Ver mis propiedades
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Consulta el listado de tus propiedades y las novedades asociadas.
          </p>
        </a>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Propiedades
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Luego aquí mostraremos cuántas propiedades tienes registradas.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Tickets abiertos
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Más adelante conectamos las novedades de tus inmuebles.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Contratos por vencer
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Aquí irán las alertas basadas en fechas de contrato.
          </p>
        </div>
      </section>
    </main>
  );
}
