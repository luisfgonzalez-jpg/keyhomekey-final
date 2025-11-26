'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { colombiaDepartments } from '@/lib/colombiaData'; // ajusta el nombre si es distinto

type UserProfile = {
  id: string;
  name: string | null;
  role: string | null;
};

type FormState = {
  address: string;
  type: string;
  department: string;
  municipality: string;
  is_rented: boolean;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  contract_start_date: string; // YYYY-MM-DD
  contract_end_date: string;
  owner_phone: string;
};

export default function NewPropertyPage() {
  const [loading, setLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    address: '',
    type: '',
    department: '',
    municipality: '',
    is_rented: false,
    tenant_name: '',
    tenant_email: '',
    tenant_phone: '',
    contract_start_date: '',
    contract_end_date: '',
    owner_phone: '',
  });

  // Cargar perfil del owner
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = '/login';
        return;
      }

      const { data, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, name, role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !data) {
        setError('No pudimos cargar tu perfil de propietario.');
        return;
      }

      setOwnerProfile(data as UserProfile);
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ownerProfile) {
      setError('No se encontró tu perfil de propietario.');
      return;
    }

    if (!form.address || !form.department || !form.municipality) {
      setError('Por favor completa al menos dirección, departamento y municipio.');
      return;
    }

    setLoading(true);

    const payload: any = {
      owner_id: ownerProfile.id,
      address: form.address,
      type: form.type || null,
      department: form.department || null,
      municipality: form.municipality || null,
      is_rented: form.is_rented,
      owner_phone: form.owner_phone || null,
    };

    if (form.is_rented) {
      payload.tenant_name = form.tenant_name || null;
      payload.tenant_email = form.tenant_email || null;
      payload.tenant_phone = form.tenant_phone || null;
      payload.contract_start_date = form.contract_start_date || null;
      payload.contract_end_date = form.contract_end_date || null;
    }

    const { error: insertError } = await supabase
      .from('properties')
      .insert([payload]);

    if (insertError) {
      console.error(insertError);
      setError('No pudimos guardar la propiedad. Intenta de nuevo.');
    } else {
      setSuccess('Propiedad registrada correctamente.');
      setForm({
        address: '',
        type: '',
        department: '',
        municipality: '',
        is_rented: false,
        tenant_name: '',
        tenant_email: '',
        tenant_phone: '',
        contract_start_date: '',
        contract_end_date: '',
        owner_phone: '',
      });
    }

    setLoading(false);
  };

  const selectedDepartment = colombiaDepartments.find(
    (d) => d.name === form.department
  );

  const municipalities =
    selectedDepartment?.municipalities ?? selectedDepartment?.cities ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            Registrar nueva propiedad
          </h1>
          <p className="text-sm text-slate-500">
            Completa la información básica del inmueble. Más adelante podremos
            agregar más detalles.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-sm"
        >
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {success}
            </p>
          )}

          {/* Dirección y tipo */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                placeholder="Ej: Calle 103 # 15-55, Apto 302"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tipo de inmueble
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
              >
                <option value="">Selecciona una opción</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Oficina">Oficina</option>
                <option value="Local">Local</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Departamento
              </label>
              <select
                name="department"
                value={form.department}
                onChange={(e) => {
                  // al cambiar depto, reseteamos municipio
                  setForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                    municipality: '',
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                required
              >
                <option value="">Selecciona un departamento</option>
                {colombiaDepartments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Municipio
              </label>
              <select
                name="municipality"
                value={form.municipality}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                required
                disabled={!form.department}
              >
                <option value="">
                  {form.department
                    ? 'Selecciona un municipio'
                    : 'Primero elige un departamento'}
                </option>
                {municipalities?.map((m: string) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teléfono propietario */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teléfono de contacto del propietario (WhatsApp)
            </label>
            <input
              name="owner_phone"
              value={form.owner_phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
              placeholder="Ej: +57 300 123 4567"
            />
          </div>

          {/* ¿Está arrendada? */}
          <div className="border-t border-slate-100 pt-4">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                name="is_rented"
                checked={form.is_rented}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              El inmueble está actualmente arrendado
            </label>

            {form.is_rented && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre del inquilino
                  </label>
                  <input
                    name="tenant_name"
                    value={form.tenant_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Correo del inquilino
                  </label>
                  <input
                    type="email"
                    name="tenant_email"
                    value={form.tenant_email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Teléfono del inquilino
                  </label>
                  <input
                    name="tenant_phone"
                    value={form.tenant_phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Inicio del contrato
                  </label>
                  <input
                    type="date"
                    name="contract_start_date"
                    value={form.contract_start_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fin del contrato
                  </label>
                  <input
                    type="date"
                    name="contract_end_date"
                    value={form.contract_end_date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <a
              href="/owner/properties"
              className="text-xs px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-100 transition"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="text-xs px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Guardar propiedad'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
