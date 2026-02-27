'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  properties?: {
    address: string;
    department: string;
    municipality: string;
  };
}

interface ProviderStats {
  active: number;
  completed: number;
  total: number;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    active: 0,
    completed: 0,
    total: 0,
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviderData();
  }, []);

  async function loadProviderData() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user found, redirecting to home');
        router.push('/');
        return;
      }

      console.log('✅ User authenticated:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        alert('Error al cargar tu perfil');
        setLoading(false);
        return;
      }

      if (!profile || profile.role !== 'PROVIDER') {
        console.log('User is not a provider, redirecting. Role:', profile?.role);
        router.push('/');
        return;
      }

      console.log('✅ Provider profile loaded:', profile.full_name);
      console.log('✅ Provider email:', profile.email);
      console.log('✅ Provider phone:', profile.phone);

      if (!profile.full_name) {
        console.warn('⚠️ ALERTA: El proveedor no tiene nombre registrado en la BD');
        console.log('Datos del perfil:', JSON.stringify(profile, null, 2));
      }

      setProviderName(profile.full_name || 'Sin nombre');
      setProviderEmail(profile.email || 'Sin email');
      setProviderPhone(profile.phone || 'Sin teléfono');
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');

      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id, specialty')
        .eq('user_id', user.id)
        .single();

      if (providerError) {
        console.error('Error fetching provider:', providerError);
        alert('Error al cargar información del proveedor');
        setLoading(false);
        return;
      }

      if (!provider) {
        console.log('No provider record found');
        setLoading(false);
        return;
      }

      console.log('✅ Provider info loaded. ID:', provider.id, 'Specialty:', provider.specialty);

      if (!provider.specialty) {
        console.warn('⚠️ ALERTA: El proveedor no tiene especialidad registrada');
        console.log('Datos del provider:', JSON.stringify(provider, null, 2));
      }

      setSpecialty(provider.specialty || 'Sin especialidad');

      console.log(`🔍 Filtrando tickets para provider ID: ${provider.id}`);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          properties!property_id (
            address,
            department,
            municipality
          )
        `)
        .eq('assigned_provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
      }

      console.log(`✅ Tickets asignados encontrados: ${ticketsData?.length || 0}`);
      setTickets(ticketsData || []);

      const active = ticketsData?.filter(t =>
        t.status !== 'Completado' &&
        t.status !== 'Resuelto' &&
        t.status !== 'Rechazado'
      ).length || 0;

      const completed = ticketsData?.filter(t =>
        t.status === 'Completado' || t.status === 'Resuelto'
      ).length || 0;

      setStats({
        active,
        completed,
        total: ticketsData?.length || 0,
      });

      console.log('📊 Stats:', { active, completed, total: ticketsData?.length || 0 });

    } catch (error) {
      console.error('❌ Error loading provider data:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptTicket(ticketId: string) {
    try {
      console.log('Accepting ticket:', ticketId);

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'En progreso' })
        .eq('id', ticketId);

      if (error) throw error;

      console.log('✅ Ticket accepted');
      alert('✅ Ticket aceptado. Ahora aparece como "En progreso".');
      await loadProviderData();
    } catch (error: unknown) {
      console.error('❌ Error accepting ticket:', error);
      alert('Error al aceptar ticket: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async function handleRejectTicket(ticketId: string) {
    if (!confirm('¿Estás seguro de rechazar este ticket? Se desasignará de ti.')) return;

    try {
      console.log('Rejecting ticket:', ticketId);

      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'Pendiente',
          assigned_provider_id: null,
          assigned_provider_name: null,
        })
        .eq('id', ticketId);

      if (error) throw error;

      console.log('✅ Ticket rejected and unassigned');
      alert('Ticket rechazado y desasignado.');
      await loadProviderData();
    } catch (error: unknown) {
      console.error('❌ Error rejecting ticket:', error);
      alert('Error al rechazar ticket: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async function handleCompleteTicket(ticketId: string) {
    if (!confirm('¿Marcar este trabajo como completado?')) return;

    try {
      console.log('Completing ticket:', ticketId);

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'Completado' })
        .eq('id', ticketId);

      if (error) throw error;

      console.log('✅ Ticket marked as completed');
      alert('✅ Trabajo marcado como completado.');
      await loadProviderData();
    } catch (error: unknown) {
      console.error('❌ Error completing ticket:', error);
      alert('Error al completar ticket: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async function handleLogout() {
    console.log('Logging out...');
    await supabase.auth.signOut();
    router.push('/');
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
        .eq('user_id', user.id);

      if (error) throw error;

      setProviderName(editName.trim());
      setProviderPhone(editPhone.trim());
      setShowEditProfileModal(false);
      alert('✅ Perfil actualizado correctamente');
    } catch (err: unknown) {
      console.error('Error saving profile:', err);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      'Asignado': 'bg-blue-100 text-blue-800 border-blue-200',
      'En progreso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completado': 'bg-green-100 text-green-800 border-green-200',
      'Resuelto': 'bg-green-100 text-green-800 border-green-200',
      'Rechazado': 'bg-red-100 text-red-800 border-red-200',
      'Pendiente': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  function getPriorityBadge(priority: string) {
    const badges: Record<string, string> = {
      'Alta': 'bg-red-100 text-red-800 border-red-200',
      'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Baja': 'bg-green-100 text-green-800 border-green-200',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">🔑 KeyHomeKey</h1>
            <p className="text-sm text-slate-600">Panel de Proveedor</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{providerName}</p>
              <p className="text-xs text-slate-500">{specialty}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
                <div className="text-sm text-slate-600 mt-1">Tickets Activos</div>
                <div className="text-xs text-slate-400 mt-1">(asignados a ti)</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-slate-600 mt-1">Completados</div>
                <div className="text-xs text-slate-400 mt-1">(asignados a ti)</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-600 mt-1">Total Asignados</div>
                <div className="text-xs text-slate-400 mt-1">(asignados a ti)</div>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">👤 Mi Perfil</h3>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="text-sm px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
            >
              Editar Perfil
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Nombre</p>
              <p className="text-sm font-medium text-slate-900">{providerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-slate-900">{providerEmail || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Teléfono</p>
              <p className="text-sm text-slate-900">{providerPhone || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Especialidad</p>
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {specialty || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">📋 Mis Tickets Asignados</h3>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona solo los trabajos que te han sido asignados
            </p>
          </div>

          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 font-medium">No tienes tickets asignados</p>
                <p className="text-sm text-slate-400 mt-1">Los nuevos trabajos aparecerán aquí cuando te sean asignados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-slate-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900 text-lg">{ticket.category}</h4>
                          <span className={`px-2 py-1 rounded border text-xs font-medium ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[ticket.properties?.address, ticket.properties?.municipality].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded border text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 mb-4 bg-white p-3 rounded border border-slate-200">
                      {ticket.description}
                    </p>

                    <div className="flex gap-2">
                      {ticket.status === 'Asignado' && (
                        <>
                          <button
                            onClick={() => handleAcceptTicket(ticket.id)}
                            className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            onClick={() => handleRejectTicket(ticket.id)}
                            className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                          >
                            ✗ Rechazar
                          </button>
                        </>
                      )}
                      {ticket.status === 'En progreso' && (
                        <button
                          onClick={() => handleCompleteTicket(ticket.id)}
                          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          ✓ Marcar como completado
                        </button>
                      )}
                      {(ticket.status === 'Completado' || ticket.status === 'Resuelto') && (
                        <div className="text-sm text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                          ✓ Trabajo completado
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                      Creado el{' '}
                      <time dateTime={ticket.created_at}>
                        {new Date(ticket.created_at).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Editar Perfil */}
      {showEditProfileModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditProfileModal(false)}
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
                  onClick={() => setShowEditProfileModal(false)}
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
    </div>
  );
}

