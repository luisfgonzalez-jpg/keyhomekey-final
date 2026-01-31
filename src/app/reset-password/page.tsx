'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Home, Lock, CheckCircle, X } from 'lucide-react';

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
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB] shadow-sm',
    outline: 'border-2 border-[#2563EB] text-[#2563EB] bg-white hover:bg-[#DBEAFE] focus:ring-[#2563EB]',
  };

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`border border-[#E2E8F0] rounded-2xl bg-white shadow-md ${className}`}>
    {children}
  </div>
);

const Input = ({
  icon: Icon,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  value = '',
  onChange = () => {},
}: any) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-[#64748B] mb-2">
        {label}
        {required && <span className="text-[#EF4444] ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
      )}
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] bg-white px-4 py-3 text-sm text-[#1E293B] outline-none transition-colors ${
          Icon ? 'pl-11' : ''
        }`}
      />
    </div>
  </div>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar que hay una sesión de recuperación
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si no hay sesión, redirigir a login
        router.push('/');
      }
    };
    
    checkSession();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud mínima
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error actualizando contraseña:', err);
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
            ¡Contraseña Actualizada!
          </h2>
          <p className="text-sm text-[#64748B] mb-4">
            Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos segundos...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-md">
            <Home size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Nueva Contraseña</h1>
            <p className="text-sm text-[#64748B]">Ingresa tu nueva contraseña</p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Nueva contraseña"
            icon={Lock}
            type="password"
            required
            value={newPassword}
            onChange={(e: any) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          
          <Input
            label="Confirmar nueva contraseña"
            icon={Lock}
            type="password"
            required
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
          />
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#EF4444] rounded-xl">
              <X size={16} className="text-[#EF4444]" />
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}
          
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-[#EF4444]">⚠️ Las contraseñas no coinciden</p>
          )}
          
          <Button 
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6} 
            type="submit" 
            className="w-full mt-2 gap-2"
          >
            {loading ? 'Actualizando...' : (
              <>
                <Lock size={16} />
                Cambiar Contraseña
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-xs text-[#64748B] text-center">
          Después de cambiar tu contraseña, podrás iniciar sesión con tu nueva contraseña.
        </p>
      </Card>
    </div>
  );
}
