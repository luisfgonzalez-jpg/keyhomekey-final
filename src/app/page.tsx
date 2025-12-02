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
      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all min-h-[90px] resize-y"
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
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty: string;
  department: string;
  municipality: string;
  is_active?: boolean;
}

interface Ticket {
  id: string;
  property_id: string;
  title?: string | null;
  category: string;
  description: string;
  priority: string;
  reporter: string;
  reported_by_email?: string | null;
  status: string;
  media_urls?: string[] | null;
  created_at?: string | null;
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
  });

  // ---------------------------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        await detectRoleAndLoad(session.user);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        setView('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // FUNCIONES DE NEGOCIO
  // ---------------------------------------------------------------------------

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const normalizedEmail = email.trim().toLowerCase();

        // 0) Verificar si este email ya fue invitado como TENANT
        const { data: invitedProfiles, error: invitedErr } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .limit(1);

        if (invitedErr) {
          console.error('Error verificando invitación de inquilino:', invitedErr);
        }

        const invitedProfile = invitedProfiles?.[0] ?? null;
        const isInvitedTenant = invitedProfile?.role === 'TENANT';

        // 1) Crear usuario en Auth
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) {
          if (error.message?.includes('User already registered')) {
            alert('Este correo ya tiene una cuenta. Por favor, inicia sesión.');
            setAuthMode('signin');
            return;
          }
          throw error;
        }

        const user = data.user;
        if (!user) throw new Error('No se pudo obtener el usuario.');

        // 2) Actualizar / crear perfil según sea TENANT invitado o OWNER nuevo
        if (isInvitedTenant && invitedProfile) {
          // TENANT invitado: vinculamos su user_id
          const { error: updateErr } = await supabase
            .from('users_profiles')
            .update({
              user_id: user.id,
              name: name.trim(),
              phone: phone.trim(),
            })
            .eq('id', invitedProfile.id);

          if (updateErr) {
            console.error('Error actualizando perfil de inquilino:', updateErr);
            alert(
              'La cuenta se creó, pero hubo un problema vinculando tu perfil de inquilino. Escríbenos a soporte.',
            );
          } else {
            alert('Cuenta de inquilino creada con éxito. Ahora puedes iniciar sesión.');
          }
        } else {
          // OWNER normal: creamos perfil nuevo con rol OWNER
          const { error: profileError } = await supabase
            .from('users_profiles')
            .insert([
              {
                user_id: user.id,
                name: name.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                role: 'OWNER',
              },
            ]);

          if (profileError) {
            console.error(profileError);
            alert(
              'La cuenta se creó, pero hubo un problema guardando el perfil en KeyhomeKey.',
            );
            return;
          }

          alert('Usuario registrado con éxito.');
        }

        // Volvemos al modo login
        setAuthMode('signin');
        setPassword('');
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.session) throw new Error('No se pudo iniciar sesión.');

        setSession(data.session);
        await detectRoleAndLoad(data.session.user);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const detectRoleAndLoad = async (user: SupabaseUser | null) => {
    try {
      if (!user) return;

      // 1) Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      

      let role: Role = null;

      // 2) Si el perfil existe y tiene un role válido, lo usamos
      if (!profileError && profile?.role) {
        if (
          profile.role === 'OWNER' ||
          profile.role === 'TENANT' ||
          profile.role === 'PROVIDER'
        ) {
          role = profile.role as Role;
        }
      }

      // 3) Si no hay role en el perfil, lo detectamos por propiedades
      if (!role) {
        const { data: tenantProps, error: tenantErr } = await supabase
          .from('properties')
          .select('id')
          .eq('tenant_email', user.email)
          .limit(1);

        if (!tenantErr && tenantProps && tenantProps.length > 0) {
          role = 'TENANT';
        } else {
          role = 'OWNER'; // por defecto propietario
        }

        // 4) Si no había perfil, lo creamos automáticamente con el role detectado
        if (!profile) {
          const guessedName =
            user.email?.split('@')[0] || 'Usuario KeyhomeKey';

          const { error: insertError } = await supabase
            .from('users_profiles')
            .insert([
              {
                user_id: user.id,
                name: guessedName,
                email: user.email,
                phone: '',
                role,
              },
            ]);

          if (insertError) {
            console.error(
              'Error creando perfil automático en users_profiles:',
              insertError,
            );
          }
        }
      }

      // 5) Actualizamos estado y cargamos datos
      setUserRole(role);
      setView('dashboard');
      await fetchData(role, user);
    } catch (error) {
      console.error('Error detectRoleAndLoad:', error);
    }
  };

  const fetchData = async (role: Role, user: SupabaseUser) => {
    if (!role) return;

    try {
      let propsData: Property[] = [];

      if (role === 'OWNER') {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        propsData = (data || []) as Property[];
      } else if (role === 'TENANT') {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .eq('tenant_email', user.email)
          .order('created_at', { ascending: false });

        propsData = (data || []) as Property[];
      } else if (role === 'PROVIDER') {
        // Más adelante aquí filtraremos por proveedor
        propsData = [];
      }

      setProperties(propsData);

      // Tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      const allTickets = (ticketsData || []) as Ticket[];

      if (role === 'OWNER') {
        const propIds = new Set(propsData.map((p) => p.id));
        setTickets(allTickets.filter((t) => propIds.has(t.property_id)));
      } else if (role === 'TENANT') {
        const propIds = new Set(propsData.map((p) => p.id));
        setTickets(
          allTickets.filter(
            (t) => propIds.has(t.property_id) || t.reporter === 'Inquilino',
          ),
        );
      } else if (role === 'PROVIDER') {
        // Por ahora mostramos todos; luego filtramos por cobertura
        setTickets(allTickets);
      }
    } catch (error) {
      console.error('Error fetchData:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setView('login');
    setEmail('');
    setPassword('');
  };

  const handleDepartmentChange = (dept: string) => {
    setNewProp((prev) => ({ ...prev, department: dept, municipality: '' }));
    const found = colombiaLocations.find((d) => d.departamento === dept);
    setAvailableCities(found ? found.ciudades : []);
  };

 const addProperty = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!session?.user) return;

  setLoading(true);

  try {
    const user = session.user;

    // 1) Asegurar que exista perfil para este owner (para la foreign key)
    try {
      const { data: profiles, error: profileErr } = await supabase
        .from('users_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1);

      console.log('profiles check:', { profiles, profileErr });

      if (profileErr) {
        console.error('Error verificando perfil del propietario:', profileErr);
      } else if (!profiles || profiles.length === 0) {
        const guessedName = user.email?.split('@')[0] || 'Usuario KeyhomeKey';

        const { error: insertProfileErr } = await supabase
          .from('users_profiles')
          .insert([
            {
              user_id: user.id,
              name: guessedName,
              email: user.email,
              phone: '',
              role: 'OWNER',
            },
          ]);

        console.log('insertProfileErr:', insertProfileErr);

        if (insertProfileErr) {
          console.error(
            'Error creando perfil automático del propietario:',
            insertProfileErr,
          );
          alert(
            'No se pudo crear el perfil del propietario en KeyhomeKey. Intenta de nuevo o contáctanos.',
          );
          return;
        }
      }
    } catch (err) {
      console.error('Error asegurando perfil del propietario:', err);
      alert(
        'Ocurrió un problema verificando tu perfil de propietario. Intenta de nuevo.',
      );
      return;
    }

    // 2) Ahora sí, crear la propiedad
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          owner_id: user.id,
          address: newProp.address,
          type: newProp.type,
          department: newProp.department,
          municipality: newProp.municipality,
          owner_phone: newProp.ownerPhone,
          is_rented: newProp.isRented,
          tenant_name: newProp.isRented ? newProp.tenantName : null,
          tenant_email: newProp.isRented ? newProp.tenantEmail : null,
          tenant_phone: newProp.isRented ? newProp.tenantPhone : null,
          contract_start_date: newProp.contractStart || null,
          contract_end_date: newProp.contractEnd || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error insertando propiedad:', error);
      alert(
        error.message ||
          'Ocurrió un problema guardando el inmueble en KeyhomeKey.',
      );
      throw error;
    }

    const insertedProperty = data as Property;

    // 3) Si el inmueble está arrendado, crear perfil TENANT si no existe
    if (newProp.isRented && newProp.tenantEmail) {
      const tenantEmail = newProp.tenantEmail.trim().toLowerCase();

      try {
        // Verificar si ya existe
        const { data: existingTenant } = await supabase
          .from('users_profiles')
          .select('id')
          .eq('email', tenantEmail)
          .limit(1);

        // Crear si no existe
        if (!existingTenant || existingTenant.length === 0) {
          const guessedName =
            newProp.tenantName?.trim() || tenantEmail.split('@')[0];

          const { error: tenantInsertError } = await supabase
            .from('users_profiles')
            .insert([
              {
                user_id: null,
                name: guessedName,
                email: tenantEmail,
                phone: newProp.tenantPhone?.trim() || '',
                role: 'TENANT',
              },
            ]);

          if (tenantInsertError) {
            console.error(
              'Error creando perfil del inquilino:',
              tenantInsertError,
            );
          }
        }
      } catch (err) {
        console.error('Error procesando perfil del inquilino:', err);
      }
    }

    // 4) Actualizar lista en pantalla
    setProperties((prev) => [insertedProperty, ...prev]);

    // 5) Si hay inquilino, enviar invitación por email (como antes)
    if (newProp.isRented && newProp.tenantEmail) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newProp.tenantEmail,
            propertyAddress: newProp.address,
          }),
        });
      } catch (err) {
        console.error('Error enviando email de invitación:', err);
      }
    }

    // 6) Resetear formulario
    setNewProp({
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
    setAvailableCities([]);

    alert('Inmueble guardado correctamente.');
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Error guardando el inmueble.');
  } finally {
    setLoading(false);
  }
};

 const createTicket = async (e: React.FormEvent) => {
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
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
        const path = `tickets/${data.id}/${Date.now()}-${safeName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('tickets-media')
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) {
          console.error('Error subiendo archivo', uploadError);
          continue;
        }

        mediaPaths.push(path);
      } catch (uploadCatchErr) {
        console.error('Excepción subiendo archivo:', uploadCatchErr);
      }
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

    // 5) Mensaje de WhatsApp
    if (property && typeof window !== 'undefined') {
      const providerText = assignedProvider
        ? `

Proveedor sugerido:
- Nombre: ${
            assignedProvider.name || 'Sin nombre'
          }
- Teléfono: ${
            assignedProvider.phone || 'Sin teléfono'
          }
- Ciudad: ${assignedProvider.municipality || ''}, ${
            assignedProvider.department || ''
          }`
        : '

Aún no hay proveedor asociado. KeyhomeKey asignará uno.';

      const text = encodeURIComponent(
        `Nuevo ticket de ${
          userRole === 'OWNER' ? 'propietario' : 'inquilino'
        }.

Inmueble: ${property.address} - ${property.municipality}, ${
          property.department
        }
Categoría: ${newTicket.category}
Prioridad: ${
          newTicket.priority
        }
Descripción: ${newTicket.description}${providerText}`,
      );

      window.open(`https://wa.me/${KEYHOME_WHATSAPP}?text=${text}`, '_blank');
    }

    // 6) Resetear formulario
    setNewTicket({
      propertyId: '',
      category: 'Plomería',
      description: '',
      priority: 'Media',
    });

    // Limpiar archivos seleccionados
    setTicketFiles([]);

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
