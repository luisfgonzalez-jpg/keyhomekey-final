// src/app/owner/properties/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Property = {
  id: string;
  address: string;
  city: string | null;
  department: string | null;
  property_type: string | null;
  is_rented: boolean | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
};

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Supabase getUser error:', userError);
        setErrorMsg('No pudimos obtener tu sesión. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMsg('Debes iniciar sesión para ver tus propiedades.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, department, property_type, is_rented, tenant_id, tenant_name, tenant_email')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase load properties error:', error);
        setErrorMsg('Error al cargar tus propiedades.');
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mis propiedades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Listado de los inmuebles que tienes registrados en KeyhomeKey.
          </p>
        </div>

        <button
          onClick={() => router.push('/owner/properties/new')}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Registrar nueva propiedad
        </button>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Cargando propiedades…</p>
      )}

      {errorMsg && !loading && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      {!loading && !errorMsg && properties.length === 0 && (
        <p className="text-sm text-slate-500">
          Aún no tienes propiedades registradas. Empieza creando la primera.
        </p>
      )}

      {!loading && !errorMsg && properties.length > 0 && (
        <ul className="space-y-3">
          {properties.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-900">
                {p.address}{' '}
                {p.city && p.department && (
                  <span className="text-xs font-normal text-slate-500">
                    • {p.city}, {p.department}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {p.property_type || 'Tipo sin especificar'} ·{' '}
                {p.is_rented ? 'Arrendado' : 'Disponible'}
                {p.is_rented && (
                  p.tenant_id ? 
                    <span className="ml-1 text-green-600">· Inquilino asignado: {p.tenant_name || p.tenant_email}</span> :
                    <span className="ml-1 text-amber-600">· Sin inquilino asignado (solo datos de contacto)</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
