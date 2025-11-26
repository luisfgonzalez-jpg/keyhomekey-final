'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { colombiaLocations } from '@/lib/colombiaData';

type FormState = {
  address: string;
  type: string;
  department: string;
  municipality: string;
  isRented: boolean;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  ownerPhone: string;
  contractStartDate: string;
  contractEndDate: string;
};

export default function NewPropertyPage() {
  const [form, setForm] = useState<FormState>({
    address: '',
    type: '',
    department: '',
    municipality: '',
    isRented: false,
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    ownerPhone: '',
    contractStartDate: '',
    contractEndDate: '',
  });

  const [loading, setLoading] = useState(false);

  const selectedDepartment = colombiaLocations.find(
    (d) => d.departamento === form.department
  );

  const municipalities = selectedDepartment?.ciudades ?? [];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleToggleRented(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      isRented: checked,
      // si deja de estar arrendado, limpiamos datos del inquilino
      ...(checked
        ? {}
        : {
            tenantName: '',
            tenantEmail: '',
            tenantPhone: '',
            contractStartDate: '',
            contractEndDate: '',
          }),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('properties').insert({
        address: form.address,
        type: form.type,
        department: form.department,
        municipality: form.municipality,
        city: form.municipality, // por si estás usando city como campo adicional
        is_rented: form.isRented,
        tenant_name: form.tenantName || null,
        tenant_email: form.tenantEmail || null,
        tenant_phone: form.tenantPhone || null,
        owner_phone: form.ownerPhone || null,
        contract_start_date: form.contractStartDate || null,
        contract_end_date: form.contractEndDate || null,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        alert('Error al guardar la propiedad. Revisa la consola para más detalles.');
        return;
      }

      alert('Propiedad guardada correctamente ✅');

      // limpiamos el formulario
      setForm({
        address: '',
        type: '',
        department: '',
        municipality: '',
        isRented: false,
        tenantName: '',
        tenantEmail: '',
        tenantPhone: '',
        ownerPhone: '',
        contractStartDate: '',
        contractEndDate: '',
      });

      // aquí más adelante podemos redirigir a /owner/properties
      // router.push('/owner/properties');

    } catch (err) {
      console.error(err);
      alert('Ocurrió un error inesperado al guardar la propiedad.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Propietario
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Registrar nueva propiedad
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa la dirección, tipo, ubicación y, si ya está arrendada, los datos
            del inquilino y fechas de contrato.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
        >
          {/* Datos básicos */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Datos del inmueble
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                  placeholder="Ej. Calle 103 # 15-55, apto 402"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tipo de inmueble
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Local">Local</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Teléfono del propietario (WhatsApp)
                </label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={form.ownerPhone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                  placeholder="Ej. +57 300 123 4567"
                />
              </div>
            </div>
          </section>

          {/* Ubicación */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Ubicación</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Departamento
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      department: e.target.value,
                      municipality: '',
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                  required
                >
                  <option value="">Selecciona un departamento</option>
                  {colombiaLocations.map((d) => (
                    <option key={d.departamento} value={d.departamento}>
                      {d.departamento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Municipio
                </label>
                <select
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                  required
                  disabled={!form.department}
                >
                  <option value="">
                    {form.department
                      ? 'Selecciona un municipio'
                      : 'Primero elige un departamento'}
                  </option>
                  {municipalities.map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Estado de arriendo */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  ¿El inmueble está arrendado?
                </h2>
                <p className="text-xs text-slate-500">
                  Si está arrendado, podremos generar alertas de contrato para ti
                  y para tu inquilino.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <span>No</span>
                <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-300 transition">
                  <input
                    type="checkbox"
                    className="peer absolute h-5 w-9 cursor-pointer opacity-0"
                    checked={form.isRented}
                    onChange={handleToggleRented}
                  />
                  <span className="pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow transition peer-checked:translate-x-4 peer-checked:bg-slate-900" />
                </div>
                <span>Sí</span>
              </label>
            </div>

            {form.isRented && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nombre del inquilino
                  </label>
                  <input
                    type="text"
                    name="tenantName"
                    value={form.tenantName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                    placeholder="Nombre completo"
                    required={form.isRented}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Correo del inquilino
                  </label>
                  <input
                    type="email"
                    name="tenantEmail"
                    value={form.tenantEmail}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                    placeholder="Ej. inquilino@correo.com"
                    required={form.isRented}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Teléfono del inquilino
                  </label>
                  <input
                    type="tel"
                    name="tenantPhone"
                    value={form.tenantPhone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                    placeholder="Ej. +57 300 000 0000"
                    required={form.isRented}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Inicio del contrato
                    </label>
                    <input
                      type="date"
                      name="contractStartDate"
                      value={form.contractStartDate}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                      required={form.isRented}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Fin del contrato
                    </label>
                    <input
                      type="date"
                      name="contractEndDate"
                      value={form.contractEndDate}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 bg-white"
                      required={form.isRented}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Botón guardar */}
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Guardando…' : 'Guardar propiedad'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

