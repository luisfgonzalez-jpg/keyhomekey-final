'use client';

import React, { useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { colombiaLocations } from '@/lib/colombiaData';
import {
  Home,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Lock,
  User,
  LogOut,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENTES UI BÁSICOS (copiados en versión simple para esta página)
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
  variant?: 'primary' | 'outline' | 'ghost';
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
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
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

// -----------------------------------------------------------------------------
// TIPOS
// -----------------------------------------------------------------------------

type AuthMode = 'signin' | 'signup';

// -----------------------------------------------------------------------------
// PÁGINA DE PROVEEDOR
// -----------------------------------------------------------------------------

export default function ProviderPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const [loading, setLoading] = useState(false);

  // campos de auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // datos del proveedor
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('Plomería');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // CARGAR SESIÓN SI YA ESTÁ LOGUEADO
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setMunicipality('');
    const found = colombiaLocations.find((d) => d.department === dept);
    setAvailableCities(found ? found.cities : []);
  };

  // ---------------------------------------------------------------------------
  // REGISTRO / LOGIN DE PROVEEDOR
  // ---------------------------------------------------------------------------

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // 1) Crear usuario en Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        const user = data.user;
        if (!user) throw new Error('No se pudo obtener el usuario.');

        // 2) Crear perfil en users_profiles como PROVIDER
        const { error: profileError } = await supabase
          .from('users_profiles')
          .insert([
            {
              user_id: user.id,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              role: 'PROVIDER',
            },
          ]);

        if (profileError) throw profileError;

        // 3) Crear registro en tabla providers
        const { error: providerError } = await supabase
          .from('providers')
          .insert([
            {
              user_id: user.id,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              specialty,
              department,
              municipality,
            },
          ]);

        if (providerError) throw providerError;

        alert('Registro de proveedor exitoso. Ahora inicia sesión.');
        setAuthMode('signin');
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmail('');
    setPassword('');
  };

  // ---------------------------------------------------------------------------
  // VISTA LOGIN / REGISTRO
  // ---------------------------------------------------------------------------

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Wrench size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                KeyhomeKey – Proveedor
              </h1>
              <p className="text-xs text-slate-500">
                Regístrate para recibir tickets de mantenimiento.
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
              Registrarme
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-sm">
            {authMode === 'signup' && (
              <>
                <Input
                  icon={User}
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

            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Especialidad
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                  >
                    <option>Plomería</option>
                    <option>Eléctrico</option>
                    <option>Electrodomésticos</option>
                    <option>Cerrajería</option>
                    <option>Otros</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Departamento
                    </label>
                    <select
                      required
                      value={department}
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
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      disabled={!department}
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
                </div>
              </>
            )}

            <Button disabled={loading} type="submit" className="w-full mt-2">
              {loading
                ? 'Procesando...'
                : authMode === 'signin'
                ? 'Entrar'
                : 'Registrarme como proveedor'}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center">
            Tus datos se usarán para asignarte tickets de propiedades cercanas a
            tu ubicación y especialidad.
          </p>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD SIMPLE DEL PROVEEDOR (luego lo mejoramos)
  // ---------------------------------------------------------------------------

  const user: SupabaseUser | undefined = session.user;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Panel proveedor
              </p>
              <h2 className="text-sm font-semibold text-slate-900">
                KeyhomeKey
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" className="text-xs gap-2" onClick={handleLogout}>
              <LogOut size={16} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Home size={16} />
            Bienvenido, proveedor
          </h3>
          <p className="text-xs text-slate-600">
            Aquí podrás ver los tickets que te asignemos según tu especialidad y
            ubicación. En la siguiente fase conectaremos este panel con la tabla
            de <strong>tickets</strong> para que puedas aceptar o rechazar
            trabajos y actualizar su estado.
          </p>
        </Card>
      </main>
    </div>
  );
}
