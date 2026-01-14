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
  X,
  Play,
  Download,
} from 'lucide-react';

const KEYHOME_WHATSAPP = '573202292534';

// -----------------------------------------------------------------------------
// INTERFACES
// -----------------------------------------------------------------------------

interface MediaInfo {
  url: string;
  name: string;
  type: string;
  size: number;
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
  media_info?: MediaInfo[];
  created_at?: string;
}

type Role = 'OWNER' | 'TENANT' | 'PROVIDER' | null;

interface Property {
  id: string;
  owner_id?: string;
  address: string;
  type: string;
  department: string;
  municipality: string;
  owner_phone?: string;
  is_rented: boolean;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  created_at?: string;
}

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
    outline: 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-600 border border-transparent',
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

const Card = ({ children, className = '', ...props }: any) => (
  <div
    className={`border border-slate-200 rounded-2xl bg-white shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const Input = ({
  icon: Icon,
  type = 'text',
  placeholder = '',
  required = false,
  value = '',
  onChange = () => {},
  ...props
}: any) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    )}
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 ${
        Icon ? 'pl-10' : ''
      }`}
      {...props}
    />
  </div>
);

const TextArea = ({
  icon: Icon,
  placeholder = '',
  required = false,
  value = '',
  onChange = () => {},
  ...props
}: any) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-3 text-slate-400" size={16} />}
    <textarea
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 resize-none ${
        Icon ? 'pl-10' : ''
      }`}
      rows={3}
      {...props}
    />
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Pendiente: 'bg-yellow-100 text-yellow-700',
    'En progreso': 'bg-blue-100 text-blue-700',
    Resuelto: 'bg-green-100 text-green-700',
    Propietario: 'bg-slate-100 text-slate-700',
    Inquilino: 'bg-slate-100 text-slate-700',
    Proveedor: 'bg-slate-100 text-slate-700',
    Usuario: 'bg-slate-100 text-slate-700',
  };

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        colors[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
};

// -----------------------------------------------------------------------------
// MEDIA VIEWER COMPONENT
// -----------------------------------------------------------------------------

const MediaViewer = ({
  mediaUrls = [],
  mediaInfo = [],
}: {
  mediaUrls?: string[];
  mediaInfo?: MediaInfo[];
}) => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Generate signed URLs for all media when component mounts or mediaUrls change
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!mediaUrls || mediaUrls.length === 0) return;
      
      console.log('🔗 Generando URLs firmadas para:', mediaUrls);
      
      const urlsMap: Record<string, string> = {};
      
      for (const path of mediaUrls) {
        try {
          const { data, error } = await supabase.storage
            .from('tickets-media')
            .createSignedUrl(path, 3600); // 1 hour expiry
          
          if (error) {
            console.error('❌ Error generando URL firmada para', path, error);
          } else if (data?.signedUrl) {
            console.log('✅ URL firmada generada para:', path);
            urlsMap[path] = data.signedUrl;
          }
        } catch (err) {
          console.error('❌ Excepción generando URL firmada:', err);
        }
      }
      
      console.log('📦 URLs firmadas totales:', Object.keys(urlsMap).length);
      setSignedUrls(urlsMap);
    };
    
    fetchSignedUrls();
  }, [mediaUrls]);

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
        <FileText size={12} />
        Sin archivos adjuntos
      </div>
    );
  }

  const getPublicUrl = (path: string) => {
    return signedUrls[path] || '';
  };

  const isImage = (url: string) => url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = (url: string) => url.match(/\.(mp4|mov|avi|webm|quicktime)$/i);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMediaClick = (url: string, path: string) => {
    setSelectedMedia(url);
    if (isImage(path)) setSelectedMediaType('image');
    else if (isVideo(path)) setSelectedMediaType('video');
    else setSelectedMediaType('file');
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setSelectedMediaType(null);
  };

  return (
    <>
      <div className="mt-3">
        <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
          <FileText size={12} />
          Archivos adjuntos ({mediaUrls.length})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaUrls.map((path, index) => {
            const publicUrl = getPublicUrl(path);
            const mediaItem = mediaInfo?.[index];

            // Don't render until signed URL is ready
            if (!publicUrl) {
              return (
                <div key={index} className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 h-20 flex items-center justify-center">
                  <span className="text-xs text-slate-400">Cargando...</span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
                onClick={() => handleMediaClick(publicUrl, path)}
              >
                {isImage(path) ? (
                  <div className="relative">
                    <img
                      src={publicUrl}
                      alt={mediaItem?.name || `Adjunto ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">
                        Ver imagen
                      </span>
                    </div>
                  </div>
                ) : isVideo(path) ? (
                  <div className="w-full h-20 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    <div className="w-10 h-10 mx-auto bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                      <Play size={16} className="text-white ml-0.5" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-20 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <FileText size={20} className="text-slate-400" />
                  </div>
                )}

                <div className="p-1.5 bg-white border-t border-slate-100">
                  <p className="text-[9px] text-slate-600 truncate font-medium">
                    {mediaItem?.name || `archivo-${index + 1}`}
                  </p>
                  {mediaItem?.size && (
                    <p className="text-[8px] text-slate-400">{formatFileSize(mediaItem.size)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para ver archivos en grande */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2 text-sm"
              onClick={closeModal}
            >
              <span>Cerrar</span>
              <X size={20} />
            </button>

            <div
              className="bg-slate-900 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMediaType === 'image' && (
                <img
                  src={selectedMedia}
                  alt="Vista ampliada"
                  className="max-w-full max-h-[80vh] object-contain mx-auto"
                />
              )}

              {selectedMediaType === 'video' && (
                <video
                  src={selectedMedia}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] mx-auto"
                />
              )}

              {selectedMediaType === 'file' && (
                <div className="bg-white p-8 text-center">
                  <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-4">Este archivo no se puede previsualizar</p>
                  <a
                    href={selectedMedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                  >
                    <Download size={16} />
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>

            {(selectedMediaType === 'image' || selectedMediaType === 'video') && (
              <div className="mt-4 text-center">
                <a
                  href={selectedMedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={16} />
                  Descargar
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// -----------------------------------------------------------------------------
// FILE UPLOADER COMPONENT
// -----------------------------------------------------------------------------

const FileUploader = ({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) => {
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const newUrls = new Map<string, string>();

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const key = `${file.name}-${index}`;
        if (!previewUrls.has(key)) {
          newUrls.set(key, URL.createObjectURL(file));
        } else {
          newUrls.set(key, previewUrls.get(key)!);
        }
      }
    });

    previewUrls.forEach((url, key) => {
      if (!newUrls.has(key)) URL.revokeObjectURL(url);
    });

    setPreviewUrls(newUrls);

    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo "${file.name}" es muy grande. Máximo 10MB por archivo.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const file = files[index];
    const key = `${file.name}-${index}`;

    if (previewUrls.has(key)) {
      URL.revokeObjectURL(previewUrls.get(key)!);
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-4">
      <label className="block text-[11px] text-slate-500 mb-1">
        Fotos / videos del problema (opcional)
      </label>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          className="hidden"
          id="ticket-files-input"
        />
        <label htmlFor="ticket-files-input" className="cursor-pointer flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <Plus className="text-slate-400" size={20} />
          </div>
          <span className="text-xs text-slate-600 font-medium">
            Haz clic para agregar fotos o videos
          </span>
          <span className="text-[10px] text-slate-400">JPG, PNG, WEBP, MP4 · Máximo 10MB por archivo</span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
            <CheckCircle size={12} className="text-green-500" />
            Archivos seleccionados ({files.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {files.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              const isVideo = file.type.startsWith('video/');
              const key = `${file.name}-${index}`;
              const previewUrl = previewUrls.get(key);

              return (
                <div key={key} className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  {isImage && previewUrl && (
                    <img src={previewUrl} alt={file.name} className="w-full h-20 object-cover" />
                  )}

                  {isVideo && (
                    <div className="w-full h-20 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                        <Play size={14} className="text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  <div className="p-2">
                    <p className="text-[10px] text-slate-600 truncate font-medium">{file.name}</p>
                    <p className="text-[9px] text-slate-400">{formatFileSize(file.size)}</p>
                  </div>

                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    onClick={() => removeFile(index)}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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

  const [newTicket, setNewTicket] = useState({
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        await detectRoleAndLoad(session.user);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserRole(null);
        setView('login');
      }
    });

    return () => subscription.unsubscribe();
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

        const { data: invitedProfiles } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .limit(1);

        const invitedProfile = invitedProfiles?.[0] ?? null;
        const isInvitedTenant = invitedProfile?.role === 'TENANT';

        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });

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

        if (isInvitedTenant && invitedProfile) {
          await supabase
            .from('users_profiles')
            .update({ user_id: user.id, name: name.trim(), phone: phone.trim() })
            .eq('id', invitedProfile.id);
          alert('Cuenta de inquilino creada con éxito. Ahora puedes iniciar sesión.');
        } else {
          await supabase.from('users_profiles').insert([
            { user_id: user.id, name: name.trim(), email: normalizedEmail, phone: phone.trim(), role: 'OWNER' },
          ]);
          alert('Usuario registrado con éxito.');
        }

        setAuthMode('signin');
        setPassword('');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.session) throw new Error('No se pudo iniciar sesión.');

        setSession(data.session);
        await detectRoleAndLoad(data.session.user);
      }
    } catch (err: any) {
      alert(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const detectRoleAndLoad = async (user: SupabaseUser | null) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let role: Role = null;

      if (profile?.role && ['OWNER', 'TENANT', 'PROVIDER'].includes(profile.role)) {
        role = profile.role as Role;
      }

      if (!role) {
        const { data: tenantProps } = await supabase
          .from('properties')
          .select('id')
          .eq('tenant_email', user.email)
          .limit(1);

        role = tenantProps && tenantProps.length > 0 ? 'TENANT' : 'OWNER';

        if (!profile) {
          await supabase.from('users_profiles').insert([
            {
              user_id: user.id,
              name: user.email?.split('@')[0] || 'Usuario',
              email: user.email,
              phone: '',
              role,
            },
          ]);
        }
      }

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
        const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
        propsData = (data || []) as Property[];
      } else if (role === 'TENANT') {
        const { data } = await supabase.from('properties').select('*').eq('tenant_email', user.email).order('created_at', { ascending: false });
        propsData = (data || []) as Property[];
      }

      setProperties(propsData);

      const { data: ticketsData } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      const allTickets = (ticketsData || []) as Ticket[];
      
      console.log('📋 Tickets cargados:', allTickets.length);
      console.log('📎 Primer ticket media_urls:', allTickets[0]?.media_urls);
      console.log('📎 Primer ticket media_info:', allTickets[0]?.media_info);

      if (role === 'OWNER' || role === 'TENANT') {
        const propIds = new Set(propsData.map((p) => p.id));
        setTickets(allTickets.filter((t) => propIds.has(t.property_id)));
      } else {
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

      const { data: profiles } = await supabase.from('users_profiles').select('user_id').eq('user_id', user.id).limit(1);

      if (!profiles || profiles.length === 0) {
        await supabase.from('users_profiles').insert([
          {
            user_id: user.id,
            name: user.email?.split('@')[0] || 'Usuario',
            email: user.email,
            phone: '',
            role: 'OWNER',
          },
        ]);
      }

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

      if (error) throw error;

      const insertedProperty = data as Property;

      if (newProp.isRented && newProp.tenantEmail) {
        const tenantEmail = newProp.tenantEmail.trim().toLowerCase();
        const { data: existingTenant } = await supabase.from('users_profiles').select('id').eq('email', tenantEmail).limit(1);

        if (!existingTenant || existingTenant.length === 0) {
          await supabase.from('users_profiles').insert([
            {
              user_id: null,
              name: newProp.tenantName?.trim() || tenantEmail.split('@')[0],
              email: tenantEmail,
              phone: newProp.tenantPhone?.trim() || '',
              role: 'TENANT',
            },
          ]);
        }

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newProp.tenantEmail, propertyAddress: newProp.address }),
        }).catch(console.error);
      }

      setProperties((prev) => [insertedProperty, ...prev]);
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
      alert(err.message || 'Error guardando el inmueble.');
    } finally {
      setLoading(false);
    }
  };


  const getRoleLabel = (role: Role) => {
    if (role === 'OWNER') return 'Propietario';
    if (role === 'TENANT') return 'Inquilino';
    if (role === 'PROVIDER') return 'Proveedor';
    return 'Usuario';
  };

  // ---------------------------------------------------------------------------
  // LOGIN VIEW
  // ---------------------------------------------------------------------------

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Home size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">KeyhomeKey</h1>
              <p className="text-xs text-slate-500">Propietarios, inquilinos y proveedores en un solo lugar.</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant={authMode === 'signin' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setAuthMode('signin')}>
              Iniciar sesión
            </Button>
            <Button variant={authMode === 'signup' ? 'primary' : 'ghost'} className="flex-1" onClick={() => setAuthMode('signup')}>
              Crear cuenta
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <Input icon={UserIcon} type="text" placeholder="Nombre completo" required value={name} onChange={(e: any) => setName(e.target.value)} />
                <Input icon={Phone} type="tel" placeholder="Teléfono (WhatsApp)" required value={phone} onChange={(e: any) => setPhone(e.target.value)} />
              </>
            )}
            <Input icon={Mail} type="email" placeholder="Email" required value={email} onChange={(e: any) => setEmail(e.target.value)} />
            <Input icon={Lock} type="password" placeholder="Contraseña" required value={password} onChange={(e: any) => setPassword(e.target.value)} />
            <Button disabled={loading} type="submit" className="w-full mt-2">
              {loading ? 'Procesando...' : authMode === 'signin' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center">
            Al continuar aceptas recibir comunicaciones por correo y WhatsApp relacionadas con la gestión de tus inmuebles.
          </p>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD VIEW
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Panel {getRoleLabel(userRole).toLowerCase()}</p>
              <h2 className="text-sm font-semibold text-slate-900">KeyhomeKey</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={getRoleLabel(userRole)} />
            <Button variant="ghost" className="text-xs gap-2" onClick={handleLogout}>
              <LogOut size={16} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* PROPIEDADES Y RESUMEN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin size={16} />
                Mis inmuebles
              </h3>
              {userRole === 'OWNER' && (
                <Button variant="outline" className="text-xs gap-2" onClick={() => document?.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Plus size={14} />
                  Agregar inmueble
                </Button>
              )}
            </div>

            {properties.length === 0 ? (
              <p className="text-xs text-slate-500">Aún no hay inmuebles registrados.</p>
            ) : (
              <div className="space-y-3">
                {properties.map((p) => (
                  <div key={p.id} className="flex items-start justify-between border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.address}</p>
                      <p className="text-xs text-slate-500">{p.municipality}, {p.department} · {p.type}</p>
                      {p.is_rented && p.tenant_name && (
                        <p className="text-[11px] text-slate-500 mt-1">Inquilino: {p.tenant_name} ({p.tenant_email})</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-slate-500">Tel: {p.owner_phone}</span>
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

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText size={16} />
              Resumen
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Inmuebles activos</p>
                <p className="text-lg font-semibold text-slate-900">{properties.length}</p>
              </div>
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Tickets abiertos</p>
                <p className="text-lg font-semibold text-slate-900">{tickets.filter((t) => t.status !== 'Resuelto').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* FORMULARIO TICKET Y LISTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Wrench size={16} />
              Reportar falla (ticket)
            </h3>

            <form onSubmit={async (e: React.FormEvent) => {
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

                const mediaPaths: string[] = [];
                const mediaInfo: MediaInfo[] = [];

                for (const file of ticketFiles) {
                  const fileExtension = file.name.split('.').pop() || 'file';
                  const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
                  const path = `tickets/${newTicket.propertyId}/${uniqueName}`;

                  const { error: uploadError } = await supabase.storage.from('tickets-media').upload(path, file, { cacheControl: '3600', upsert: false });

                  if (uploadError) {
                    console.error('Error subiendo archivo:', uploadError);
                    continue;
                  }

                  mediaPaths.push(path);
                  mediaInfo.push({ url: path, name: file.name, type: file.type, size: file.size });
                }

                const payload = {
                  propertyId: newTicket.propertyId,
                  category: newTicket.category,
                  description: newTicket.description,
                  priority: newTicket.priority,
                  mediaPaths,
                  mediaInfo,
                  reported_by_email: session.user.email ?? '',
                  reporter: userRole === 'OWNER' ? 'Propietario' : 'Inquilino',
                };

                const resp = await fetch('/api/tickets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });

                const result = await resp.json();

                if (!result?.success) {
                  alert('Error creando ticket en servidor.');
                  return;
                }

                setTickets((prev) => [result.ticket as Ticket, ...prev]);
                setNewTicket({ propertyId: '', category: 'Plomería', description: '', priority: 'Media' });
                setTicketFiles([]);
                alert('Ticket creado correctamente.');
              } catch (err: any) {
                alert(err.message || 'Error creando el ticket.');
              } finally {
                setLoading(false);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Inmueble</label>
                <select
                  required
                  value={newTicket.propertyId}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="">Selecciona un inmueble</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.address} – {p.municipality}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Categoría</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, category: e.target.value }))}
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
                  <label className="block text-[11px] text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400"
                  >
                    <option>Alta</option>
                    <option>Media</option>
                    <option>Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Descripción de la falla</label>
                <TextArea
                  icon={MessageCircle}
                  required
                  placeholder="Describe qué está pasando, por ejemplo: fuga en el lavamanos del baño principal."
                  value={newTicket.description}
                  onChange={(e: any) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <FileUploader files={ticketFiles} setFiles={setTicketFiles} />

              <Button disabled={loading} type="submit" className="w-full mt-2 gap-2">
                {loading ? 'Creando ticket...' : <><Send size={16} />Crear ticket y notificar</>}
              </Button>

              <p className="text-[11px] text-slate-400 mt-2">
                Se enviará una notificación por WhatsApp al centro de KeyhomeKey y luego al proveedor adecuado.
              </p>
            </form>
          </Card>

          {/* LISTA DE TICKETS */}
<Card className="p-5">
  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
    <Calendar size={16} />
    Tickets recientes
  </h3>
  {tickets.length === 0 ?  (
    <p className="text-xs text-slate-500">
      Aún no hay tickets registrados. 
    </p>
  ) : (
    <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
      {tickets.map((t) => {
        const prop = properties.find((p) => p.id === t.property_id);
        
        // 🔥 NUEVO: Generar URLs públicas para las imágenes
        const mediaUrls = t.media_urls?.map((path) => {
          const { data } = supabase.storage
            .from('tickets-media')
            .getPublicUrl(path);
          return data. publicUrl;
        }) || [];

        return (
          <div
            key={t.id}
            className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50 text-xs flex justify-between gap-2"
          >
            <div className="flex-1">
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
              
              {/* 🔥 NUEVO:  Mostrar imágenes/videos adjuntos */}
              {mediaUrls. length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaUrls.map((url, idx) => {
                    const isVideo = url.match(/\.(mp4|mov|quicktime)$/i);
                    return isVideo ? (
                      <video
                        key={idx}
                        src={url}
                        controls
                        className="w-20 h-20 object-cover rounded border border-slate-200"
                      />
                    ) : (
                      <img
                        key={idx}
                        src={url}
                        alt={`Adjunto ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    );
                  })}
                </div>
              )}
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
        {/* FORMULARIO NUEVO INMUEBLE */}
        {userRole === 'OWNER' && (
          <Card id="add-property" className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Plus size={16} />
              Registrar nuevo inmueble
            </h3>

            <form onSubmit={addProperty} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Dirección</label>
                  <Input icon={MapPin} type="text" required placeholder="Calle 123 #45-67 Apto 302" value={newProp.address} onChange={(e: any) => setNewProp((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tipo de inmueble</label>
                  <select value={newProp.type} onChange={(e) => setNewProp((prev) => ({ ...prev, type: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400">
                    <option>Apartamento</option>
                    <option>Casa</option>
                    <option>Local</option>
                    <option>Bodega</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Departamento</label>
                  <select required value={newProp.department} onChange={(e) => handleDepartmentChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400">
                    <option value="">Selecciona un departamento</option>
                    {colombiaLocations.map((d) => (
                      <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Municipio / ciudad</label>
                  <select required value={newProp.municipality} onChange={(e) => setNewProp((prev) => ({ ...prev, municipality: e.target.value }))} disabled={!newProp.department} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 disabled:bg-slate-100">
                    <option value="">Selecciona un municipio</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Teléfono del propietario (WhatsApp)</label>
                  <Input icon={Phone} type="tel" required placeholder="3202292534" value={newProp.ownerPhone} onChange={(e: any) => setNewProp((prev) => ({ ...prev, ownerPhone: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input id="is_rented" type="checkbox" checked={newProp.isRented} onChange={(e) => setNewProp((prev) => ({ ...prev, isRented: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                <label htmlFor="is_rented" className="text-[11px] text-slate-600">El inmueble está arrendado</label>
              </div>

              {newProp.isRented && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Nombre del inquilino</label>
                    <Input icon={UserIcon} type="text" required value={newProp.tenantName} onChange={(e: any) => setNewProp((prev) => ({ ...prev, tenantName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Email del inquilino</label>
                    <Input icon={Mail} type="email" required value={newProp.tenantEmail} onChange={(e: any) => setNewProp((prev) => ({ ...prev, tenantEmail: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">WhatsApp del inquilino</label>
                    <Input icon={Phone} type="tel" required value={newProp.tenantPhone} onChange={(e: any) => setNewProp((prev) => ({ ...prev, tenantPhone: e.target.value }))} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Inicio del contrato (opcional)</label>
                  <Input icon={Calendar} type="date" value={newProp.contractStart} onChange={(e: any) => setNewProp((prev) => ({ ...prev, contractStart: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Fin del contrato (opcional)</label>
                  <Input icon={Calendar} type="date" value={newProp.contractEnd} onChange={(e: any) => setNewProp((prev) => ({ ...prev, contractEnd: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button disabled={loading} type="submit" className="gap-2">
                  {loading ? 'Guardando...' : <><CheckCircle size={16} />Guardar inmueble</>}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}