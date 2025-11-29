'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { colombiaLocations } from '@/lib/colombiaData';
import {
  Home,
  Wrench,
  Phone,
  Mail,
  Lock,
  MapPin,
  CheckCircle,
} from 'lucide-react';

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
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  className?: string;
}) => {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants: Record<string, string> = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900',
    outline:
      'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-300',
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

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 ${
      props.className || ''
    }`}
  />
);

export default function ProviderSignupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [specialty, setSpecialty] = useState('Plomería');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    setMunicipality('');
    const found = colombiaLocations.find((d) => d.departamento === dept);
    setAvailableCities(found ? found.ciudades : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('No se pudo crear el usuario.');

      // 2. Crear perfil en users_profiles como PROVIDER
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

      // 3. Crear registro en providers
      const { error: providerError } = await supabase.from('providers').insert([
        {
          user_id: user.id,
          specialty,
          department,
          municipality,
        },
      ]);

      if (providerError) throw providerError;

      alert(
        'Registro de proveedor exitoso. Ahora puedes iniciar sesión desde la página principal.',
      );

      // limpiar formulario
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setSpecialty('Plomería');
      setDepartment('');
      setMunicipality('');
      setAvailableCities([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error registrando proveedor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Home size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Registro de proveedor
            </h1>
            <p className="text-xs text-slate-500">
              Únete a la red de KeyhomeKey y recibe solicitudes de servicio de
              propietarios e inquilinos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              icon={Wrench}
              type="text"
              placeholder="Nombre o empresa"
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
          </div>

          <Input
            icon={Mail}
            type="email"
            placeholder="Correo electrónico"
            required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Crea una contraseña"
            required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Especialidad
              </label>
              <Select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option>Plomería</option>
                <option>Eléctrico</option>
                <option>Electrodomésticos</option>
                <option>Cerrajería</option>
                <option>Otros</option>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Departamento
              </label>
              <Select
                required
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
              >
                <option value="">Selecciona un departamento</option>
                {colombiaLocations.map((d) => (
                  <option key={d.departamento} value={d.departamento}>
                    {d.departamento}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Municipio
              </label>
              <Select
                required
                disabled={!department}
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              >
                <option value="">Selecciona un municipio</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Button
            disabled={loading}
            type="submit"
            className="w-full mt-2 gap-2"
          >
            {loading ? (
              'Registrando proveedor...'
            ) : (
              <>
                <CheckCircle size={16} />
                Crear cuenta de proveedor
              </>
            )}
          </Button>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Al registrarte aceptas recibir notificaciones de KeyhomeKey por
            correo y WhatsApp sobre tickets relacionados con tu especialidad y
            zona de cobertura.
          </p>
        </form>
      </div>
    </div>
  );
}
