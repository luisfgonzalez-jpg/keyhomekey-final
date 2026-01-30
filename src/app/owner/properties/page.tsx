// src/app/owner/properties/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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

  // Filter states
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRented, setFilterRented] = useState<string>('all');

  // Delete states
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Delete handler
  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // Verify ownership before deleting
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Debes iniciar sesión para eliminar propiedades');
        setIsDeleting(false);
        return;
      }

      // Delete from Supabase (RLS will ensure only owner can delete)
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('owner_id', user.id); // Extra safety: ensure owner

      if (error) {
        console.error('Error deleting property:', error);
        alert('Error al eliminar la propiedad. Por favor intenta de nuevo.');
        setIsDeleting(false);
        return;
      }

      // Update local state
      setProperties(properties.filter(p => p.id !== propertyId));
      alert('Propiedad eliminada correctamente ✅');
      
    } catch (err) {
      console.error('Unexpected error deleting property:', err);
      alert('Ocurrió un error inesperado al eliminar la propiedad');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Filter by city
      if (filterCity !== 'all' && property.city !== filterCity) {
        return false;
      }
      
      // Filter by address (search)
      if (filterSearch && !property.address?.toLowerCase().includes(filterSearch.toLowerCase())) {
        return false;
      }
      
      // Filter by property type
      if (filterType !== 'all' && property.property_type !== filterType) {
        return false;
      }
      
      // Filter by rental status
      if (filterRented !== 'all') {
        const isRented = property.is_rented;
        if (filterRented === 'rented' && !isRented) return false;
        if (filterRented === 'available' && isRented) return false;
      }
      
      return true;
    });
  }, [properties, filterCity, filterSearch, filterType, filterRented]);

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(properties.map(p => p.city).filter(c => c !== null))).sort();
  }, [properties]);

  // Get unique property types for filter dropdown
  const propertyTypes = ['Apartamento', 'Casa', 'Oficina', 'Local', 'Bodega', 'Otro'];

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
        <>
          {/* Filters Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Filtros</h3>
            
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search by address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Buscar por dirección
                </label>
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Calle 123..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* Filter by city */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Ciudad
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                >
                  <option value="all">Todas las ciudades</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Filter by property type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Tipo de inmueble
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                >
                  <option value="all">Todos los tipos</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Filter by rental status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Estado
                </label>
                <select
                  value={filterRented}
                  onChange={(e) => setFilterRented(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                >
                  <option value="all">Todos</option>
                  <option value="rented">Arrendados</option>
                  <option value="available">Disponibles</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="text-xs text-slate-500">
              Mostrando {filteredProperties.length} de {properties.length} propiedades
            </div>
          </div>

          <ul className="space-y-3">
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No se encontraron propiedades con los filtros seleccionados
              </div>
            ) : (
              filteredProperties.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm relative"
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteProperty(p.id)}
                    disabled={isDeleting}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar propiedad"
                    aria-label="Eliminar propiedad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                  <p className="text-sm font-medium text-slate-900 pr-12">
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
              ))
            )}
          </ul>
        </>
      )}
    </main>
  );
}
