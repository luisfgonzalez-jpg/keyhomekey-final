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

export default function NewPropertyPage() {
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('Apartamento');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [department, setDepartment] = useState('Bogotá D.C.');
  const [city, setCity] = useState('Bogotá D.C.');
  const [isRented, setIsRented] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const departments: DepartmentOption[] = colombiaLocations;

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

      // 2. Validate tenant email before proceeding (if property is rented and email is provided)
      if (isRented && tenantEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(tenantEmail.trim())) {
          console.error('❌ Invalid tenant email format:', tenantEmail);
          alert('Error: El formato del email del inquilino es inválido');
          setLoading(false);
          return;
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Tenant email validated:', tenantEmail.trim());
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
        tenant_name: isRented ? tenantName.trim() : null,
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

      // 5. Send welcome email to tenant if property is rented and email is provided
      let emailSent = false;
      if (isRented && tenantEmail) {
        try {
          // Debug logging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('📧 Sending welcome email to tenant');
          }

          // Get owner profile for full name
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('❌ Error fetching owner profile:', profileError);
          }

          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: tenantEmail.trim(),
              subject: '¡Bienvenido/a a KeyHomeKey! Tu nueva herramienta de gestión',
              template: 'tenantWelcome',
              variables: {
                tenantName: tenantName || 'Inquilino',
                propertyAddress: address,
                propertyType: propertyType,
                city: city,
                department: department,
                ownerName: profile?.full_name || 'Tu propietario',
                ownerPhone: ownerPhone,
                contractStart: contractStart || 'No especificado',
                contractEnd: contractEnd || 'No especificado',
                loginUrl: `${window.location.origin}/sign-in`,
              }
            })
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('❌ Error sending welcome email:', errorText);
            // Don't block flow if email fails
          } else {
            if (process.env.NODE_ENV === 'development') {
              const result = await emailResponse.json();
              console.log('✅ Welcome email sent successfully');
              console.log('📧 Email ID:', result.data?.emailId);
            }
            emailSent = true;
          }
        } catch (emailError) {
          console.error('❌ Failed to send welcome email:', emailError);
          // No bloquear el flujo
        }
      }

      // Show appropriate success message
      if (isRented && tenantEmail && !emailSent) {
        alert('Propiedad guardada correctamente ✅\n\nNota: No se pudo enviar el email de bienvenida al inquilino. Por favor, contacta al inquilino manualmente.');
      } else {
        alert('Propiedad guardada correctamente ✅');
      }
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Nombre del inquilino
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Email del inquilino *
                </label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  required={isRented}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                  placeholder="inquilino@ejemplo.com"
                />
              </div>

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


