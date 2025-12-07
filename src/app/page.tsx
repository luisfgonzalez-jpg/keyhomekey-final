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

// Sanitize phone number for WhatsApp URL (remove non-numeric characters)
const sanitizePhoneNumber = (phone: string | null): string | null => {
  if (!phone) return null;
  return phone.replace(/[^0-9]/g, '');
};

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
  name: string;
  email?: string;
  phone: string | null;
  specialty: string;
  department: string;
  municipality: string;
  user_id?: string | null;
  is_active?: boolean;
}

interface Ticket {
  id: string;
  property_id: string;
  title?: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  reporter: string;
  reported_by_email?: string;
  media_urls?: string[];
  created_at?: string;
  assigned_provider_name?: string | null;
  assigned_provider_phone?: string | null;
  assigned_provider_specialty?: string | null;
  provider_source?: 'retel' | 'local' | 'none';
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
    providerOption?: string;
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

    // 1) Intentar encontrar un proveedor local compatible
    let assignedProvider: Provider | null = null;
    // 1) Intentar encontrar un proveedor compatible (por ubicación y especialidad)
    let assignedProvider: any = null;

    try {
      // First try to find a provider matching both location AND category/specialty
      const { data: providersWithSpecialty, error: specialtyError } = await supabase
        .from('providers')
        .select('*')
        .eq('department', property.department)
        .eq('municipality', property.municipality)
        .eq('specialty', newTicket.category)
        .limit(1);

      if (providersError) {
        console.error('Error buscando proveedores locales:', providersError);
      } else if (providers && providers.length > 0) {
        assignedProvider = providers[0] as Provider;
      if (!specialtyError && providersWithSpecialty && providersWithSpecialty.length > 0) {
        assignedProvider = providersWithSpecialty[0];
      } else {
        // Fallback: find any provider in the same location
        const { data: providers, error: providersError } = await supabase
          .from('providers')
          .select('*')
          .eq('department', property.department)
          .eq('municipality', property.municipality)
          .limit(1);

        if (!providersError && providers && providers.length > 0) {
          assignedProvider = providers[0];
        }
      }
    } catch (provErr) {
      console.error('Error en matching de proveedor local:', provErr);
    }

    // 2) Crear el ticket
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          property_id: newTicket.propertyId,
          title: `Ticket de ${newTicket.category}`,
          category: newTicket.category,
          description: newTicket.description,
          priority: newTicket.priority,
          reporter: userRole === 'OWNER' ? 'Propietario' : 'Inquilino',
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

      const { error: uploadError } = await supabase.storage
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
        (data as Ticket).media_urls = mediaPaths;
      }
    }

    // 5) Llamar a Retel AI para matching de proveedores externos
    let retelProvider: Provider | null = null;
    let providerSource: 'retel' | 'local' | 'none' = 'none';

    try {
      const retelResponse = await fetch('/api/retel-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newTicket.category,
          description: newTicket.description,
          priority: newTicket.priority,
          location: {
            department: property.department,
            municipality: property.municipality,
          },
          ticketId: data.id,
        }),
      });

      const retelData = await retelResponse.json();

      if (retelData.success && retelData.providers && retelData.providers.length > 0) {
        retelProvider = retelData.providers[0] as Provider;
        console.log('✅ Retel provider found:', retelProvider.name);
      }
    } catch (retelErr) {
      console.error('Error en Retel AI matching:', retelErr);
      // Continue with local fallback - don't break the flow
    }

    // 6) Determinar proveedor a usar (Retel primero, luego local)
    const providerToUse = retelProvider || assignedProvider;

    if (retelProvider) {
      providerSource = 'retel';
    } else if (assignedProvider) {
      providerSource = 'local';
    }

    // 7) Actualizar ticket con datos del proveedor asignado
    if (providerToUse || providerSource !== 'none') {
      const { error: providerUpdateError } = await supabase
        .from('tickets')
        .update({
          assigned_provider_name: providerToUse?.name || null,
          assigned_provider_phone: providerToUse?.phone || null,
          assigned_provider_specialty: providerToUse?.specialty || null,
          provider_source: providerSource,
        })
        .eq('id', data.id);

      if (providerUpdateError) {
        console.error('Error actualizando proveedor asignado:', providerUpdateError);
      }
    }

    setTickets((prev) => [data as Ticket, ...prev]);
    setTicketFiles([]);

    // 8) Mensaje de WhatsApp
    if (property && typeof window !== 'undefined') {
      const sourceLabel = providerSource === 'retel' ? 'Retel AI' : providerSource === 'local' ? 'Local' : '';
      const providerText = providerToUse
        ? `\n\nProveedor sugerido (${sourceLabel}):\n- Nombre: ${
            providerToUse.name || 'Sin nombre'
          }\n- Teléfono: ${
            providerToUse.phone || 'Sin teléfono'
          }\n- Especialidad: ${
            providerToUse.specialty || 'General'
          }\n- Ciudad: ${providerToUse.municipality || ''}, ${
            providerToUse.department || ''
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

      // Use provider phone if available, fallback to KEYHOME_WHATSAPP
      const sanitizedProviderPhone = sanitizePhoneNumber(providerToUse?.phone ?? null);
      const whatsappNumber = sanitizedProviderPhone || KEYHOME_WHATSAPP;
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    // 3) Mensaje de WhatsApp (via backend API) - Enviar al proveedor
    if (property && assignedProvider && assignedProvider.phone) {
      // Message to send to the provider
      const message = `🔔 Nuevo ticket de ${
        userRole === 'OWNER' ? 'propietario' : 'inquilino'
      }.\n\n📍 Inmueble: ${property.address} - ${property.municipality}, ${
        property.department
      }\n🔧 Categoría: ${newTicket.category}\n⚡ Prioridad: ${
        newTicket.priority
      }\n📝 Descripción: ${newTicket.description}\n\nPor favor responda a este mensaje para confirmar disponibilidad.`;

      try {
        const response = await fetch('/api/whatsapp/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: assignedProvider.phone,
            message,
          }),
        });
        
        if (!response.ok) {
          console.error('Error en respuesta de WhatsApp API:', await response.text());
        }
      } catch (whatsappErr) {
        console.error('Error sending WhatsApp notification:', whatsappErr);
        // Don't fail the ticket creation if WhatsApp notification fails
      }
    } else if (property && !assignedProvider) {
      // No provider found - notify KeyhomeKey center
      const message = `🔔 Nuevo ticket SIN proveedor asignado.\n\n📍 Inmueble: ${property.address} - ${property.municipality}, ${
        property.department
      }\n🔧 Categoría: ${newTicket.category}\n⚡ Prioridad: ${
        newTicket.priority
      }\n📝 Descripción: ${newTicket.description}\n\n⚠️ No se encontró proveedor en esta zona. Por favor asignar manualmente.`;

      try {
        await fetch('/api/whatsapp/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: KEYHOME_WHATSAPP,
            message,
          }),
        });
      } catch (whatsappErr) {
        console.error('Error sending WhatsApp notification to KeyhomeKey:', whatsappErr);
      }
    }

    // 9) Resetear formulario
    setNewTicket({
      propertyId: '',
      category: 'Plomería',
      description: '',
      priority: 'Media',
      providerOption: 'KeyhomeKey',
    });

    alert('Ticket creado correctamente.');
  } catch (err: unknown) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Error creando el ticket.';
    alert(errorMessage);
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
