// src/app/owner/properties/new/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { colombiaLocations } from '@/lib/colombiaData';

type DepartmentOption = {
  departamento: string;
  ciudades: string[];
};

type TenantUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
};

export default function NewPropertyPage() {
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('Bogotá D.C.');
  const [isRented, setIsRented] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New tenant selection state
  const [tenantSelectionMode, setTenantSelectionMode] = useState<'manual' | 'existing'>('manual');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantUser[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const router = useRouter();

  const departments: DepartmentOption[] = colombiaLocations;

  // Load available tenant users when tenant selection mode is 'existing'
  useEffect(() => {
    const loadTenantUsers = async () => {
      if (tenantSelectionMode === 'existing' && isRented) {
        setLoadingTenants(true);
        try {
          // Query users_profiles for users with role TENANT
          const { data, error } = await supabase
            .from('users_profiles')
            .select('user_id, name, email, phone')
            .eq('role', 'TENANT')
            .order('name');

          if (error) {
            console.error('Error loading tenant users:', error);
          } else {
            setAvailableTenants(data || []);
          }
        } catch (err) {
          console.error('Unexpected error loading tenants:', err);
        } finally {
          setLoadingTenants(false);
        }
      }
    };

    loadTenantUsers();
  }, [tenantSelectionMode, isRented]);

  // Handle tenant selection from dropdown
  const handleTenantSelection = (userId: string) => {
    setSelectedTenantId(userId);
    const selectedTenant = availableTenants.find(t => t.user_id === userId);
    if (selectedTenant) {
      // Auto-fill tenant info from selected user
      setTenantName(selectedTenant.name);
      setTenantEmail(selectedTenant.email);
      setTenantPhone(selectedTenant.phone);
    }
  };

  // Clear tenant selection when switching to manual mode
  const handleSelectionModeChange = (mode: 'manual' | 'existing') => {
    setTenantSelectionMode(mode);
    if (mode === 'manual') {
      setSelectedTenantId(null);
    }
  };

  // Actualizar ciudades cuando cambie el departamento
  useEffect(() => {
    const dep = departments.find((d) => d.departamento === department);
    if (dep) {
      // Si la ciudad actual no existe en ese depto, selecciona la primera
      if (!dep.ciudades.includes(city)) {
        setCity(dep.ciudades[0]);
      }
    }
  }, [department, departments, city]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 1. Obtener usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Supabase getUser error:', userError);
        alert('No pudimos obtener tu sesión. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      if (!user) {
        alert('Debes iniciar sesión para registrar una propiedad.');
        setLoading(false);
        router.push('/login');
        return;
      }

      // 2. Look up tenant_id if manual mode with email provided
      let tenantUserId = null;
      
      if (isRented) {
        if (selectedTenantId) {
          // Existing tenant mode: use the selected tenant ID
          tenantUserId = selectedTenantId;
        } else if (tenantEmail) {
          // Manual mode: try to find tenant by email in profiles (case-insensitive)
          const { data: tenantProfile, error: tenantError } = await supabase
            .from('users_profiles')
            .select('user_id')
            .ilike('email', tenantEmail.trim())
            .single();
          
          if (tenantError && tenantError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" - that's OK, just means tenant not registered
            // Other errors should be logged
            console.error('Error looking up tenant by email:', tenantError);
          } else if (tenantProfile) {
            tenantUserId = tenantProfile.user_id;
          }
        }
      }

      // 3. Preparar payload de la propiedad
      const payload = {
        owner_id: user.id,
        address: address.trim(),
        property_type: propertyType,
        owner_phone: ownerPhone.trim(),
        department,
        city,
        is_rented: isRented,
        tenant_id: tenantUserId,
        tenant_name: isRented ? tenantName.trim() : null,
        tenant_email: isRented ? tenantEmail.trim() : null,
        tenant_phone: isRented ? tenantPhone.trim() : null,
        contract_start: isRented && contractStart ? contractStart : null,
        contract_end: isRented && contractEnd ? contractEnd : null,
      };

      // 4. Insert en Supabase
      const { error } = await supabase.from('properties').insert([payload]);

      if (error) {
        console.error('Supabase insert error:', error);
        alert('Error al guardar la propiedad. Revisa la consola para más detalles.');
        setLoading(false);
        return;
      }

      // 5. Send welcome email to tenant if property is rented and tenant email exists
      if (isRented && tenantEmail && tenantEmail.trim()) {
        try {
          // Fetch owner profile to include in email
          const { data: ownerProfile, error: profileError } = await supabase
            .from('users_profiles')
            .select('name, email, phone')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.error('⚠️ Error al obtener perfil del propietario:', profileError);
          }

          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: tenantEmail.trim(),
              name: tenantName.trim(),
              type: 'tenant-invitation',
              propertyData: {
                address: address.trim(),
                property_type: propertyType,
                owner_name: ownerProfile?.name || 'Propietario',
                owner_email: ownerProfile?.email,
                owner_phone: ownerPhone.trim(),
                contract_start: contractStart,
                contract_end: contractEnd,
                city: city,
                department: department,
              },
            }),
          });

          const emailResult = await emailResponse.json();
          
          if (emailResult.success) {
            console.log('✅ Email de bienvenida enviado al inquilino');
          } else {
            console.error('⚠️ No se pudo enviar el email al inquilino:', emailResult.error);
            // Don't fail property creation if email fails
          }
        } catch (emailError) {
          console.error('⚠️ Error enviando email al inquilino:', emailError);
          // Don't fail property creation if email fails
        }
      }

      alert('Propiedad guardada correctamente ✅');
      router.push('/owner/properties');
    } catch (err) {
      console.error('Unexpected error saving property:', err);
      alert('Ocurrió un error inesperado al guardar la propiedad.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDepartment = departments.find(
    (d) => d.departamento === department
  );

  const citiesForDepartment = selectedDepartment?.ciudades ?? [];

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Registrar nueva propiedad
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa la dirección, tipo, ubicación y, si ya está arrendada, los datos del inquilino y fechas de contrato.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Datos del inmueble */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Datos del inmueble
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Dirección
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              placeholder="Calle 103 # 15-55"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Tipo de inmueble
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              >
                <option>Apartamento</option>
                <option>Casa</option>
                <option>Oficina</option>
                <option>Local</option>
                <option>Bodega</option>
                <option>Otro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Teléfono del propietario (WhatsApp)
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="3100000000"
              />
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Ubicación
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Departamento
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              >
                {departments.map((d) => (
                  <option key={d.departamento} value={d.departamento}>
                    {d.departamento}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Municipio
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              >
                {citiesForDepartment.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Arrendamiento */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">
                ¿El inmueble está arrendado?
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Si está arrendado, podremos generar alertas de contrato para ti y para tu inquilino.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className={!isRented ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                No
              </span>
              <button
                type="button"
                onClick={() => setIsRented(!isRented)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isRented ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    isRented ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={isRented ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                Sí
              </span>
            </div>
          </div>

          {isRented && (
            <>
              {/* Tenant Selection Mode */}
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="text-xs font-medium text-slate-700">
                  Método de asignación de inquilino
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectionModeChange('manual')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      tenantSelectionMode === 'manual'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Ingresar datos manualmente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectionModeChange('existing')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      tenantSelectionMode === 'existing'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Seleccionar inquilino registrado
                  </button>
                </div>
              </div>

              {/* Existing Tenant Selection */}
              {tenantSelectionMode === 'existing' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Seleccionar inquilino registrado
                  </label>
                  {loadingTenants ? (
                    <p className="text-xs text-slate-500">Cargando inquilinos...</p>
                  ) : availableTenants.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No hay inquilinos registrados. Usa el modo manual para ingresar los datos.
                    </p>
                  ) : (
                    <select
                      value={selectedTenantId || ''}
                      onChange={(e) => handleTenantSelection(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                    >
                      <option value="">-- Selecciona un inquilino --</option>
                      {availableTenants.map((tenant) => (
                        <option key={tenant.user_id} value={tenant.user_id}>
                          {tenant.name} ({tenant.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Manual Tenant Input or Display Selected Tenant Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Nombre del inquilino
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    disabled={tenantSelectionMode === 'existing' && !!selectedTenantId}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Email del inquilino
                  </label>
                  <input
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    disabled={tenantSelectionMode === 'existing' && !!selectedTenantId}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Teléfono del inquilino
                  </label>
                  <input
                    type="tel"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    disabled={tenantSelectionMode === 'existing' && !!selectedTenantId}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          {isRented && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Fecha de inicio del contrato
                </label>
                <input
                  type="date"
                  value={contractStart}
                  onChange={(e) => setContractStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Fecha de finalización del contrato
                </label>
                <input
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-900 px-6 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Guardando…' : 'Guardar propiedad'}
          </button>
        </div>
      </form>
    </main>
  );
}


