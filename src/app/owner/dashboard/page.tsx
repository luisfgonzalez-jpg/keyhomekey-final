'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export default function OwnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Obtener usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // Si no hay sesión, manda al login (ajusta la ruta si usas otra)
        window.location.href = '/login';
        return;
      }

      // 2. Buscar su perfil en users_profiles
      const { data, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, name, email, role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !data) {
        console.error(profileError);
        setError('No pudimos cargar tu perfil de propietario.');
      } else {
        setProfile(data as UserProfile);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando tu panel…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500">
          No encontramos tu perfil. Habla con el administrador.
        </p>
      </main>
    );
  }

  // Si quieres ser estricto con el rol:
  if (profile.role && profile.role !== 'owner') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500">
          Este panel es solo para propietarios. Rol actual: {profile.role}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabecera simple */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hola, {profile.name || 'Propietario'}
            </h1>
            <p className="text-sm text-slate-500">
              Administra tus propiedades y las novedades de tus inmuebles.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs px-3 py-2 rounded-full border border-slate-300 hover:bg-slate-100 transition"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Acciones principales, estilo limpio */}
        <section className="grid gap-4 md:grid-cols-2 mb-10">
          <Link
            href="/owner/properties/new"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm hover:shadow-md transition block"
          >
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Registrar nueva propiedad
            </h2>
            <p className="text-xs text-slate-500">
              Crea un inmueble con dirección, ubicación y datos del inquilino si ya está arrendado.
            </p>
          </Link>

          <Link
            href="/owner/properties"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm hover:shadow-md transition block"
          >
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Ver mis propiedades
            </h2>
            <p className="text-xs text-slate-500">
              Consulta el listado de tus propiedades y las novedades asociadas.
            </p>
          </Link>
        </section>

        {/* Placeholder muy minimal para futuros resúmenes */}
        <section className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="uppercase tracking-wide text-slate-400 mb-1">
              Propiedades
            </p>
            <p className="text-xl font-semibold text-slate-900">—</p>
            <p className="mt-1 text-slate-500">
              Luego aquí mostraremos cuántas propiedades tienes registradas.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="uppercase tracking-wide text-slate-400 mb-1">
              Tickets abiertos
            </p>
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
