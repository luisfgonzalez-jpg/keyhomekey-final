'use client';

import React, { useState, useEffect } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { colombiaLocations } from '@/lib/colombiaData';

import {
  Home,
  User as UserIcon,
  Wrench,
  MapPin,
  Plus,
  CheckCircle,
  AlertTriangle,
  Truck,
  UserCheck,
  LogOut,
  MessageCircle,
  Calendar,
  Mail,
  Lock,
  Phone,
  Send,
  FileText,
} from 'lucide-react';

const KEYHOME_WHATSAPP = '573103055424'; // número general de KeyhomeKey

// -----------------------------------------------------------------------------
// UI BÁSICA
// -----------------------------------------------------------------------------

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}) => {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants: Record<string, string> = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900',
    outline:
      'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-300',
    ghost:
      'text-slate-600 hover:bg-slate-100 focus:ring-slate-200 border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-500 focus:ring-red-600 border border-transparent',
  };

  const disabledStyle = disabled
    ? 'opacity-60 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabledStyle} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => (
  <div
    id={id}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
      <Icon size={20} />
    </div>
    <input
      {...props}
      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all"
    />
  </div>
);

const TextArea = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <div className="absolute left-3 top-4 text-slate-400">
      <Icon size={20} />
    </div>
    <textarea
      {...props}
      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all min-h-[90px] resize-vertical"
    />
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-slate-100 text-slate-700';
  if (status === 'Pendiente')
    color = 'bg-amber-100 text-amber-800 border border-amber-200';
  if (status === 'Asignado')
    color = 'bg-blue-100 text-blue-800 border border-blue-200';
  if (status === 'En Camino')
    color = 'bg-indigo-100 text-indigo-800 border border-indigo-200';
  if (status === 'Resuelto')
    color = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (status === 'Cancelado')
    color = 'bg-red-100 text-red-800 border border-red-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
};

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

type Role = 'OWNER' | 'TENANT' | 'PROVIDER' | null;

interface Property {
  id: string;
  address: string;
  department: string;
  municipality: string;
  type: string;
  owner_phone: string;
  is_rented: boolean;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
}

interface Provider {
  id: string;
  user_id: string | null;
  specialty: string;
  department: string;
  municipality: string;
  is_active: boolean;
  phone: string | null;
}
interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  department: string;
  municipality: string;
}

// -----------------------------------------------------------------------------
// PÁGINA PRINCIPAL
// -----------------------------------------------------------------------------

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<Role>(null);
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);


  // AUTH
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // FORM PROPIEDAD
  const [newProp, setNewProp] = useState({
    address: '',
    type: 'Apartamento',
    department: '',
    municipality: '',
    ownerPhone: '',
    isRented: false,
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    contractStart: '',
    contractEnd: '',
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);

   // FORM TICKET
  type NewTicket = {
    propertyId: string;
    category: string;
    description: string;
    priority: string;
  };

  const [newTicket, setNewTicket] = useState<NewTicket>({
    propertyId: '',
    category: 'Plomería',
    description: '',
    priority: 'Media',
  });const createTicket = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!session?.user) return;

  if (!newTicket.propertyId) {
    alert('Selecciona un inmueble.');
    return;
  }

  try {
    setLoading(true);

    const property = properties.find((p) => p.id === newTicket.propertyId);
    if (!property) {
      alert('No encontramos el inmueble seleccionado.');
      return;
    }

    // 1) Intentar encontrar un proveedor compatible
    let assignedProvider: any = null;

    try {
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('*')
        .eq('department', property.department)
        .eq('municipality', property.municipality)
        .limit(1);

      if (providersError) {
        console.error('Error buscando proveedores:', providersError);
      } else if (providers && providers.length > 0) {
        assignedProvider = providers[0];
      }
    } catch (provErr) {
      console.error('Error en matching de proveedor:', provErr);
    }

    // 2) Crear el ticket
    const { data, error } = await supabase
  .from('tickets')
  .insert([
    {
      property_id: newTicket.propertyId,
      // 👇 Nuevo: título del ticket
      title: `Ticket de ${newTicket.category}`,
      category: newTicket.category,
      description: newTicket.description,
      priority: newTicket.priority,
      reporter: userRole === 'OWNER' ? 'Propietario' : 'Inquilino',
      // 👇 Nuevo: quién lo reporta (email del usuario logueado)
      reported_by_email: session.user.email ?? '',
      status: 'Pendiente',
    },
  ])
  .select()
  .single();

    if (error) throw error;
    // 3) Subir archivos al bucket
const mediaPaths: string[] = [];

for (const file of ticketFiles) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `tickets/${data.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase
    .from('tickets-media')
    .upload(path, file);

  if (uploadError) {
    console.error('Error subiendo archivo', uploadError);
    continue;
  }

  mediaPaths.push(path);
}

// 4) Actualizar ticket con media_urls
if (mediaPaths.length > 0) {
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ media_urls: mediaPaths })
    .eq('id', data.id);

  if (updateError) {
    console.error('Error actualizando media_urls', updateError);
  } else {
    (data as any).media_urls = mediaPaths;
  }
}


    setTickets((prev) => [data as Ticket, ...prev]);

    // 3) Mensaje de WhatsApp
    if (property && typeof window !== 'undefined') {
      const providerText = assignedProvider
        ? `\n\nProveedor sugerido:\n- Nombre: ${
            assignedProvider.name || 'Sin nombre'
          }\n- Teléfono: ${
            assignedProvider.phone || 'Sin teléfono'
          }\n- Ciudad: ${assignedProvider.municipality || ''}, ${
            assignedProvider.department || ''
          }`
        : '\n\nAún no hay proveedor asociado. KeyhomeKey asignará uno.';

      const text = encodeURIComponent(
        `Nuevo ticket de ${
          userRole === 'OWNER' ? 'propietario' : 'inquilino'
        }.\n\nInmueble: ${property.address} - ${property.municipality}, ${
          property.department
        }\nCategoría: ${newTicket.category}\nPrioridad: ${
          newTicket.priority
        }\nDescripción: ${newTicket.description}${providerText}`,
      );

      window.open(`https://wa.me/${KEYHOME_WHATSAPP}?text=${text}`, '_blank');
    }

    // 4) Resetear formulario
    setNewTicket({
      propertyId: '',
      category: 'Plomería',
      description: '',
      priority: 'Media',
      providerOption: 'KeyhomeKey',
    });

    alert('Ticket creado correctamente.');
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Error creando el ticket.');
  } finally {
    setLoading(false);
  }
};

  // ---------------------------------------------------------------------------
  // VISTAS
  // ---------------------------------------------------------------------------

  const getRoleLabel = (role: Role) => {
    if (role === 'OWNER') return 'Propietario';
    if (role === 'TENANT') return 'Inquilino';
    if (role === 'PROVIDER') return 'Proveedor';
    return 'Usuario';
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Home size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                KeyhomeKey
              </h1>
              <p className="text-xs text-slate-500">
                Propietarios, inquilinos y proveedores en un solo lugar.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={authMode === 'signin' ? 'primary' : 'ghost'}
              className="flex-1"
              onClick={() => setAuthMode('signin')}
            >
              Iniciar sesión
            </Button>
            <Button
              variant={authMode === 'signup' ? 'primary' : 'ghost'}
              className="flex-1"
              onClick={() => setAuthMode('signup')}
            >
              Crear cuenta
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <Input
                  icon={UserIcon}
                  type="text"
                  placeholder="Nombre completo"
                  required
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                />
                <Input
                  icon={Phone}
                  type="tel"
                  placeholder="Teléfono (WhatsApp)"
                  required
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                />
              </>
            )}

            <Input
              icon={Mail}
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
            <Input
              icon={Lock}
              type="password"
              placeholder="Contraseña"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />

            <Button disabled={loading} type="submit" className="w-full mt-2">
              {loading
                ? 'Procesando...'
                : authMode === 'signin'
                ? 'Entrar'
                : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center">
            Al continuar aceptas recibir comunicaciones por correo y WhatsApp
            relacionadas con la gestión de tus inmuebles.
          </p>
        </Card>
      </div>
    );
  }

  // DASHBOARD (propietario o inquilino)
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Panel {getRoleLabel(userRole || null).toLowerCase()}
              </p>
              <h2 className="text-sm font-semibold text-slate-900">
                KeyhomeKey
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={getRoleLabel(userRole || null)} />
            <Button
              variant="ghost"
              className="text-xs gap-2"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* BLOQUE DE PROPIEDADES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin size={16} />
                Mis inmuebles
              </h3>
              {userRole === 'OWNER' && (
                <Button
                  variant="outline"
                  className="text-xs gap-2"
                  onClick={() =>
                    document
                      ?.getElementById('add-property')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  <Plus size={14} />
                  Agregar inmueble
                </Button>
              )}
            </div>

            {properties.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay inmuebles registrados.
              </p>
            ) : (
              <div className="space-y-3">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between border border-slate-100 rounded-xl px-4 py-3 bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {p.address}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.municipality}, {p.department} · {p.type}
                      </p>
                      {p.is_rented && p.tenant_name && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Inquilino: {p.tenant_name} ({p.tenant_email})
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-slate-500">
                        Tel: {p.owner_phone}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <UserCheck size={12} />
                        {p.is_rented ? 'Arrendado' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* TUS ESTADÍSTICAS SENCILLAS */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={16} />
              Resumen
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">
                  Inmuebles activos
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {properties.length}
                </p>
              </div>
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">
                  Tickets abiertos
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {tickets.filter((t) => t.status !== 'Resuelto').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* FORMULARIO NUEVO TICKET */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Wrench size={16} />
              Reportar falla (ticket)
            </h3>

            <form onSubmit={createTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Inmueble
                </label>
                <select
                  required
                  value={newTicket.propertyId}
                  onChange={(e) =>
                    setNewTicket((prev) => ({
                      ...prev,
                      propertyId: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="">Selecciona un inmueble</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address} – {p.municipality}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                  >
                    <option>Plomería</option>
                    <option>Eléctrico</option>
                    <option>Electrodomésticos</option>
                    <option>Cerrajería</option>
                    <option>Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                  >
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Descripción de la falla
                </label>
                <TextArea
                  icon={MessageCircle}
                  required
                  placeholder="Describe qué está pasando, por ejemplo: fuga en el lavamanos del baño principal."
                  value={newTicket.description}
                  onChange={(e: any) =>
                    setNewTicket((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-4">
  <label className="block text-[11px] text-slate-500 mb-1">
    Fotos / videos del problema
  </label>

  <input
    type="file"
    multiple
    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
    onChange={(e) => {
      const files = Array.from(e.target.files ?? []);
      setTicketFiles((prev) => [...prev, ...files]);
    }}
  />

  <div className="mt-2 flex flex-wrap gap-2">
    {ticketFiles.map((file, index) => (
      <div
        key={index}
        className="border rounded px-2 py-1 text-[11px] bg-slate-50"
      >
        <div className="truncate max-w-[140px]">{file.name}</div>
        <button
          type="button"
          className="text-red-500 mt-1"
          onClick={() =>
            setTicketFiles((prev) =>
              prev.filter((_, i) => i !== index)
            )
          }
        >
          Quitar
        </button>
      </div>
    ))}
  </div>
</div>

              <Button
                disabled={loading}
                type="submit"
                className="w-full mt-2 gap-2"
              >
                {loading ? (
                  'Creando ticket...'
                ) : (
                  <>
                    <Send size={16} />
                    Crear ticket y notificar
                  </>
                )}
              </Button>

              <p className="text-[11px] text-slate-400 mt-2">
                Se enviará una notificación por WhatsApp al centro de KeyhomeKey
                y luego al proveedor adecuado según la ubicación y el tipo de
                falla.
              </p>
            </form>
          </Card>

          {/* LISTA DE TICKETS */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Calendar size={16} />
              Tickets recientes
            </h3>
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay tickets registrados.
              </p>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
                {tickets.map((t) => {
                  const prop = properties.find((p) => p.id === t.property_id);
                  return (
                    <div
                      key={t.id}
                      className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50 text-xs flex justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <Wrench size={13} />
                          {t.category} ·{' '}
                          <span className="font-normal text-slate-600">
                            {t.priority}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {t.description}
                        </p>
                        {prop && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            {prop.address} – {prop.municipality}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1">
                          Reportado por: {t.reporter}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={t.status} />
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <Truck size={11} />
                          Flujo KeyhomeKey
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* FORMULARIO NUEVO INMUEBLE (solo propietario) */}
        {userRole === 'OWNER' && (
          <Card id="add-property" className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Plus size={16} />
              Registrar nuevo inmueble
            </h3>

            <form onSubmit={addProperty} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Dirección
                  </label>
                  <Input
                    icon={MapPin}
                    type="text"
                    required
                    placeholder="Calle 123 #45-67 Apto 302"
                    value={newProp.address}
                    onChange={(e: any) =>
                      setNewProp((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Tipo de inmueble
                  </label>
                  <select
                    value={newProp.type}
                    onChange={(e) =>
                      setNewProp((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                  >
                    <option>Apartamento</option>
                    <option>Casa</option>
                    <option>Local</option>
                    <option>Bodega</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Departamento
                  </label>
                  <select
                    required
                    value={newProp.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
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
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Municipio / ciudad
                  </label>
                  <select
                    required
                    value={newProp.municipality}
                    onChange={(e) =>
                      setNewProp((prev) => ({
                        ...prev,
                        municipality: e.target.value,
                      }))
                    }
                    disabled={!newProp.department}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 disabled:bg-slate-100"
                  >
                    <option value="">Selecciona un municipio</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Teléfono del propietario (WhatsApp)
                  </label>
                  <Input
                    icon={Phone}
                    type="tel"
                    required
                    placeholder="3103055424"
                    value={newProp.ownerPhone}
                    onChange={(e: any) =>
                      setNewProp((prev) => ({
                        ...prev,
                        ownerPhone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  id="is_rented"
                  type="checkbox"
                  checked={newProp.isRented}
                  onChange={(e) =>
                    setNewProp((prev) => ({
                      ...prev,
                      isRented: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label
                  htmlFor="is_rented"
                  className="text-[11px] text-slate-600"
                >
                  El inmueble está arrendado
                </label>
              </div>

              {newProp.isRented && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Nombre del inquilino
                    </label>
                    <Input
                      icon={UserIcon}
                      type="text"
                      required
                      value={newProp.tenantName}
                      onChange={(e: any) =>
                        setNewProp((prev) => ({
                          ...prev,
                          tenantName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Email del inquilino
                    </label>
                    <Input
                      icon={Mail}
                      type="email"
                      required
                      value={newProp.tenantEmail}
                      onChange={(e: any) =>
                        setNewProp((prev) => ({
                          ...prev,
                          tenantEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      WhatsApp del inquilino
                    </label>
                    <Input
                      icon={Phone}
                      type="tel"
                      required
                      value={newProp.tenantPhone}
                      onChange={(e: any) =>
                        setNewProp((prev) => ({
                          ...prev,
                          tenantPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Inicio del contrato (opcional)
                  </label>
                  <Input
                    icon={Calendar}
                    type="date"
                    value={newProp.contractStart}
                    onChange={(e: any) =>
                      setNewProp((prev) => ({
                        ...prev,
                        contractStart: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Fin del contrato (opcional)
                  </label>
                  <Input
                    icon={Calendar}
                    type="date"
                    value={newProp.contractEnd}
                    onChange={(e: any) =>
                      setNewProp((prev) => ({
                        ...prev,
                        contractEnd: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button disabled={loading} type="submit" className="gap-2">
                  {loading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Guardar inmueble
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
