'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type UserProfile = {
  id: string;
  name: string | null;
  role: string | null;
};

type Property = {
  id: string;
  address: string;
  type: string | null;
  department: string | null;
  municipality: string | null;
  is_rented: boolean | null;
  tenant_name: string | null;
};

export default function OwnerPropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = '/login';
        return;
      }

      // 2. Perfil en users_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, name, role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        setError('No pudimos cargar tu perfil de propietario.');
        setLoading(false);
        return;
      }

      const ownerProfile = profileData as UserProfile;
      setProfile(ownerProfile);

      // 3. Propiedades de este owner
      const { data: propertiesData, error: propsError } = await supabase
        .from('properties')
        .select(
          'id, address, type, department, municipality, is_rented, tenant_name'
        )
        .eq('owner_id', ownerProfile.id)
        .order('created_at', { ascending: false });

      if (propsError) {
        setError('No pudimos cargar tus propiedades.');
      } else if (propertiesData) {
        setProperties(propertiesData as Property[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando tus propiedades…</p>
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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Mis propiedades
            </h1>
            <p className="text-sm text-slate-500">
              {profile?.name
                ? `Propiedades registradas por ${profile.name}.`
                : 'Listado de propiedades registradas.'}
            </p>
          </div>

          <a
            href="/owner/properties/new"
            className="text-xs px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-100 transition"
          >
            + Registrar nueva propiedad
          </a>
        </header>

        {properties.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">
              Aún no tienes propiedades registradas.
            </p>
            <a
              href="/owner/properties/new"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-300 text-xs hover:bg-slate-100 transition"
            >
              Registrar la primera propiedad
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {properties.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.type || 'Sin tipo'} · {p.municipality || '—'},{' '}
                    {p.department || '—'}
                  </p>
                </div>
                <div className="text-xs text-right">
                  <p
                    className={
                      'inline-flex items-center rounded-full px-3 py-1 ' +
                      (p.is_rented
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600')
                    }
                  >
                    {p.is_rented ? 'Arrendada' : 'Disponible'}
                  </p>
                  {p.is_rented && p.tenant_name && (
                    <p className="mt-1 text-slate-500">
                      Inquilino: {p.tenant_name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
