// src/app/owner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface OwnerProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone, role, created_at')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
        setEditName(data?.full_name || '');
        setEditPhone(data?.phone || '');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim(), phone: editPhone.trim() })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: editName.trim(), phone: editPhone.trim() } : prev);
      setShowEditModal(false);
      alert('✅ Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  }

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

      {/* Perfil del propietario */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Mi Perfil</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando perfil…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Nombre</p>
              <p className="text-sm font-medium text-slate-900">{profile?.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-slate-900">{profile?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Teléfono</p>
              <p className="text-sm text-slate-900">{profile?.phone || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Rol</p>
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                Propietario
              </span>
            </div>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition"
          >
            Editar Perfil
          </button>
        </div>
      </section>

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

      {/* Modal: Editar Perfil */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Editar Perfil</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder="3001234567"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
