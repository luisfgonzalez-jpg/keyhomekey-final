'use client';

import React, { useState, useEffect } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
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
  Search,
  Filter,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

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

interface UserProfile {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string;
}

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
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
}) => {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants: Record<string, string> = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB] shadow-sm',
    outline: 'border-2 border-[#2563EB] text-[#2563EB] bg-white hover:bg-[#DBEAFE] focus:ring-[#2563EB]',
    ghost: 'text-[#2563EB] hover:bg-[#DBEAFE] focus:ring-[#2563EB]',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444] shadow-sm',
    success: 'bg-[#10B981] text-white hover:bg-[#059669] focus:ring-[#10B981] shadow-sm',
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
    className={`border border-[#E2E8F0] rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

const Input = ({
  icon: Icon,
  label,
  error,
  type = 'text',
  placeholder = '',
  required = false,
  value = '',
  onChange = () => {},
  ...props
}: any) => (
  <div className="w-full">
    {label && (
      <label className="block text-[11px] font-medium text-[#64748B] mb-1">
        {label}
        {required && <span className="text-[#EF4444] ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
      )}
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E2E8F0] focus:border-[#2563EB]'} bg-white px-3 py-2 text-xs text-[#1E293B] outline-none transition-colors ${
          Icon ? 'pl-10' : ''
        }`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-[10px] text-[#EF4444] mt-1">{error}</p>
    )}
  </div>
);

const TextArea = ({
  icon: Icon,
  label,
  error,
  placeholder = '',
  required = false,
  value = '',
  onChange = () => {},
  ...props
}: any) => (
  <div className="w-full">
    {label && (
      <label className="block text-[11px] font-medium text-[#64748B] mb-1">
        {label}
        {required && <span className="text-[#EF4444] ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 text-[#94A3B8]" size={16} />}
      <textarea
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E2E8F0] focus:border-[#2563EB]'} bg-white px-3 py-2 text-xs text-[#1E293B] outline-none transition-colors resize-none ${
          Icon ? 'pl-10' : ''
        }`}
        rows={3}
        {...props}
      />
    </div>
    {error && (
      <p className="text-[10px] text-[#EF4444] mt-1">{error}</p>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Pendiente: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]',
    'En progreso': 'bg-[#DBEAFE] text-[#1E40AF] border border-[#60A5FA]',
    Resuelto: 'bg-[#D1FAE5] text-[#065F46] border border-[#34D399]',
    Propietario: 'bg-[#EDE9FE] text-[#5B21B6] border border-[#A78BFA]',
    Inquilino: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#60A5FA]',
    Proveedor: 'bg-[#D1FAE5] text-[#065F46] border border-[#34D399]',
    Usuario: 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]',
  };

  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        colors[status] || 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
      }`}
    >
      {status}
    </span>
  );
};

const StatsCard = ({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  color,
  trend
}: {
  label: string;
  value: string | number;
  change?: number;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
}) => {
  const colorClasses = {
    blue: 'bg-[#DBEAFE] text-[#2563EB]',
    green: 'bg-[#D1FAE5] text-[#10B981]',
    yellow: 'bg-[#FEF3C7] text-[#F59E0B]',
    purple: 'bg-[#EDE9FE] text-[#7C3AED]',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <TrendingUp size={14} className="text-[#10B981]" />}
            {trend === 'down' && <TrendingDown size={14} className="text-[#EF4444]" />}
            <span className={`text-xs font-semibold ${change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[#1E293B] mb-1">{value}</p>
      <p className="text-sm text-[#64748B]">{label}</p>
    </Card>
  );
};

const TopProvidersCard = () => {
  // Datos de ejemplo (hardcoded por ahora)
  const topProviders = [
    {
      id: '1',
      name: 'José Martínez',
      specialty: 'Plomería',
      rating: 4.9,
      totalJobs: 12,
      satisfaction: 98,
    },
    {
      id: '2',
      name: 'Ana García',
      specialty: 'Electricidad',
      rating: 4.8,
      totalJobs: 8,
      satisfaction: 95,
    },
    {
      id: '3',
      name: 'Carlos Ruiz',
      specialty: 'HVAC',
      rating: 4.6,
      totalJobs: 15,
      satisfaction: 92,
    },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#FEF3C7] rounded-xl">
          <Star size={20} className="text-[#F59E0B]" />
        </div>
        Top Proveedores
      </h3>
      <div className="space-y-3">
        {topProviders.map((provider, index) => (
          <div key={provider.id} className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{provider.name}</p>
                <p className="text-xs text-[#64748B]">{provider.specialty} · {provider.totalJobs} trabajos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.floor(provider.rating) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E2E8F0]'}
                  />
                ))}
                <span className="text-xs font-semibold text-[#1E293B] ml-1">{provider.rating}</span>
              </div>
              <p className="text-xs text-[#64748B]">{provider.satisfaction}% satisfacción</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TicketsPieChart = ({ tickets }: { tickets: Ticket[] }) => {
  const pending = tickets.filter(t => t.status === 'Pendiente').length;
  const inProgress = tickets.filter(t => t.status === 'En progreso').length;
  const resolved = tickets.filter(t => t.status === 'Resuelto').length;
  
  const data = [
    { name: 'Pendiente', value: pending, color: '#F59E0B' },
    { name: 'En progreso', value: inProgress, color: '#3B82F6' },
    { name: 'Resuelto', value: resolved, color: '#10B981' },
  ].filter(item => item.value > 0); // Solo mostrar si hay datos

  if (data.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-lg font-bold text-[#1E293B] mb-4">Tickets por Estado</h3>
        <div className="h-[250px] flex items-center justify-center text-sm text-[#64748B]">
          No hay tickets registrados aún
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold text-[#1E293B] mb-4">Tickets por Estado</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

const ActivityBarChart = ({ tickets }: { tickets: Ticket[] }) => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const today = new Date();
  
  const data = days.map((day, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    
    const count = tickets.filter(t => {
      if (!t.created_at) return false;
      const ticketDate = new Date(t.created_at);
      return ticketDate.toDateString() === date.toDateString();
    }).length;
    
    return { day, tickets: count };
  });

  return (
    <Card className="p-5">
      <h3 className="text-lg font-bold text-[#1E293B] mb-4">Actividad (Últimos 7 días)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="day" stroke="#64748B" style={{ fontSize: '12px' }} />
          <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
          <Tooltip />
          <Bar dataKey="tickets" fill="#2563EB" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
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
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<Role>(null);
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Estados para modales
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);

  // Estados para formularios
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [tenantForm, setTenantForm] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    contractStart: '',
    contractEnd: '',
  });

  // Propiedad seleccionada para editar inquilino
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Estado para guardar el perfil completo del usuario
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    avgResponseTime: 0,
    pendingTickets: 0,
    resolvedThisMonth: 0
  });

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Estado para modal de recuperación de contraseña
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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

  // Auto-redirect for password recovery tokens
  useEffect(() => {
    // Check if there's a recovery token in the URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      
      // Check if hash contains type=recovery (password recovery token)
      if (hash) {
        try {
          // Parse hash as URLSearchParams for robust token detection
          const params = new URLSearchParams(hash.slice(1));
          // Only redirect if this is a valid Supabase recovery token
          if (params.get('type') === 'recovery' && params.get('access_token')) {
            // Redirect to reset-password page with the hash preserved
            router.push(`/reset-password${hash}`);
          }
        } catch (error) {
          // If parsing fails, ignore and continue normal flow
          console.error('Error parsing URL hash:', hash, error);
        }
      }
    }
  }, [router]);

  // Cargar perfil del usuario actual
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;
      
      try {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error cargando perfil:', error);
          return;
        }
        
        if (data) {
          setProfile(data);
          setProfileForm({
            name: data.name || '',
            phone: data.phone || '',
          });
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    
    loadProfile();
  }, [session]);
  // Calcular métricas cuando cambian los tickets
  useEffect(() => {
    if (tickets.length > 0) {
      const pending = tickets.filter(t => t.status === 'Pendiente').length;
      
      const now = new Date();
      const thisMonth = tickets.filter(t => {
        if (!t.created_at) return false;
        const created = new Date(t.created_at);
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear() &&
               t.status === 'Resuelto';
      }).length;
      
      setMetrics({
        totalTickets: tickets.length,
        avgResponseTime: 2.5, // Placeholder - calcular real después
        pendingTickets: pending,
        resolvedThisMonth: thisMonth
      });
    } else {
      setMetrics({
        totalTickets: 0,
        avgResponseTime: 0,
        pendingTickets: 0,
        resolvedThisMonth: 0
      });
    }
  }, [tickets]);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      alert('❌ Por favor ingresa tu email');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call our custom API endpoint for password reset
      const response = await fetch('/api/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Error al enviar el email de recuperación');
      }
      
      setShowForgotPasswordModal(false);
      setResetEmail('');
      alert('✅ Te hemos enviado un email con instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.');
      
    } catch (error: any) {
      console.error('Error en recuperación de contraseña:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users_profiles')
        .update({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
        })
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Actualizar estado local
      if (profile) {
        setProfile({ ...profile, name: profileForm.name, phone: profileForm.phone });
      }
      
      setShowEditProfileModal(false);
      alert('✅ Perfil actualizado correctamente');
      
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('❌ Las contraseñas nuevas no coinciden');
      return;
    }
    
    // Validar longitud mínima
    if (passwordForm.newPassword.length < 6) {
      alert('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      
      // Actualizar contraseña con Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      setShowChangePasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      alert('✅ Contraseña actualizada correctamente');
      
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = (property: Property) => {
    setSelectedProperty(property);
    setTenantForm({
      tenantName: property.tenant_name || '',
      tenantEmail: property.tenant_email || '',
      tenantPhone: property.tenant_phone || '',
      contractStart: property.contract_start_date || '',
      contractEnd: property.contract_end_date || '',
    });
    setShowEditTenantModal(true);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      
      // 1. Actualizar propiedad
      const { error: propError } = await supabase
        .from('properties')
        .update({
          tenant_name: tenantForm.tenantName.trim(),
          tenant_email: tenantForm.tenantEmail.trim().toLowerCase(),
          tenant_phone: tenantForm.tenantPhone.trim(),
          contract_start_date: tenantForm.contractStart || null,
          contract_end_date: tenantForm.contractEnd || null,
        })
        .eq('id', selectedProperty.id);
      
      if (propError) throw propError;
      
      // 2. Verificar si el inquilino ya existe en users_profiles
      const tenantEmail = tenantForm.tenantEmail.trim().toLowerCase();
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('users_profiles')
        .select('id')
        .eq('email', tenantEmail)
        .maybeSingle();
      
      // 3. Si no existe, crear perfil de inquilino
      if (!existingProfile && !profileCheckError) {
        const { error: profileError } = await supabase
          .from('users_profiles')
          .insert([{
            user_id: null,
            name: tenantForm.tenantName.trim(),
            email: tenantEmail,
            phone: tenantForm.tenantPhone.trim(),
            role: 'TENANT',
          }]);
        
        if (profileError) {
          console.error('Error creando perfil inquilino:', profileError);
          // No lanzamos el error para que la actualización de propiedad se complete
          // pero informamos al usuario
          alert('⚠️ Propiedad actualizada, pero hubo un problema al crear el perfil del inquilino');
        }
      }
      
      // 4. Actualizar estado local
      setProperties(properties.map(p =>
        p.id === selectedProperty.id
          ? {
              ...p,
              tenant_name: tenantForm.tenantName,
              tenant_email: tenantForm.tenantEmail,
              tenant_phone: tenantForm.tenantPhone,
              contract_start_date: tenantForm.contractStart,
              contract_end_date: tenantForm.contractEnd,
            }
          : p
      ));
      
      setShowEditTenantModal(false);
      setSelectedProperty(null);
      alert('✅ Inquilino actualizado correctamente');
      
    } catch (error: any) {
      console.error('Error actualizando inquilino:', error);
      alert('❌ Error: ' + error.message);
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

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ---------------------------------------------------------------------------
  // LOGIN VIEW
  // ---------------------------------------------------------------------------

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-md">
              <Home size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">KeyHomeKey</h1>
              <p className="text-sm text-[#64748B]">Propietarios, inquilinos y proveedores en un solo lugar.</p>
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

            {authMode === 'signin' && (
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="w-full text-center text-sm text-[#2563EB] hover:text-[#1D4ED8] mt-3 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center">
            Al continuar aceptas recibir comunicaciones por correo y WhatsApp relacionadas con la gestión de tus inmuebles.
          </p>
        </Card>

        {/* MODAL: Recuperar Contraseña */}
        {showForgotPasswordModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForgotPasswordModal(false)}
          >
            <Card 
              className="max-w-md w-full p-6" 
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1E293B]">🔐 Recuperar Contraseña</h3>
                <button 
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetEmail('');
                  }}
                  className="text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-sm text-[#64748B] mb-4">
                Ingresa tu email y te enviaremos instrucciones para recuperar tu contraseña.
              </p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Email"
                  icon={Mail}
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e: any) => setResetEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setResetEmail('');
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading ? 'Enviando...' : (
                      <>
                        <Send size={16} />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD VIEW
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <header className="border-b border-[#E2E8F0] bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-md">
              <Home size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">KeyHomeKey</h1>
              <p className="text-sm text-[#64748B]">Panel {getRoleLabel(userRole).toLowerCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge status={getRoleLabel(userRole)} />
            <Button variant="ghost" className="text-sm gap-2" onClick={handleLogout}>
              <LogOut size={18} />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* NUEVA SECCIÓN: Métricas Animadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Tickets"
            value={metrics.totalTickets}
            change={12}
            trend="up"
            icon={FileText}
            color="blue"
          />
          <StatsCard
            label="Tiempo Promedio"
            value={`${metrics.avgResponseTime}h`}
            change={8}
            trend="down"
            icon={Clock}
            color="green"
          />
          <StatsCard
            label="Pendientes"
            value={metrics.pendingTickets}
            icon={AlertCircle}
            color="yellow"
          />
          <StatsCard
            label="Resueltos (mes)"
            value={metrics.resolvedThisMonth}
            change={15}
            trend="up"
            icon={CheckCircle}
            color="purple"
          />
        </div>

        {/* Grid principal con gráficos y sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TicketsPieChart tickets={tickets} />
              <ActivityBarChart tickets={tickets} />
            </div>

            {properties.length === 0 ? (
              <p className="text-xs text-slate-500">Aún no hay inmuebles registrados.</p>
            ) : (
              <div className="space-y-3">
                {properties.map((p) => (
                  <div key={p.id} className="flex items-start justify-between border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{p.address}</p>
                      <p className="text-xs text-slate-500">{p.municipality}, {p.department} · {p.type}</p>
                      {p.is_rented && p.tenant_name && (
                        <p className="text-[11px] text-slate-500 mt-1">Inquilino: {p.tenant_name} ({p.tenant_email})</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] text-slate-500">Tel: {p.owner_phone}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <UserCheck size={12} />
                        {p.is_rented ? 'Arrendado' : 'Disponible'}
                      </span>
                      {userRole === 'OWNER' && p.is_rented && (
                        <Button 
                          variant="outline" 
                          className="text-xs h-7 px-2"
                          onClick={() => handleEditTenant(p)}
                        >
                          Cambiar Inquilino
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (1/3) - Resumen */}
          <div className="space-y-6">
            {/* Propiedades */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3">
                  <div className="p-2 bg-[#DBEAFE] rounded-xl">
                    <MapPin size={20} className="text-[#2563EB]" />
                  </div>
                  Mis inmuebles
                </h3>
                {userRole === 'OWNER' && (
                  <Button variant="primary" className="text-sm gap-2" onClick={() => document?.getElementById('add-property')?.scrollIntoView({ behavior: 'smooth' })}>
                    <Plus size={16} />
                    Agregar inmueble
                  </Button>
                )}
              </div>

              {properties.length === 0 ? (
                <p className="text-sm text-[#64748B]">Aún no hay inmuebles registrados.</p>
              ) : (
                <div className="space-y-3">
                  {properties.map((p) => (
                    <div key={p.id} className="flex items-start justify-between border border-[#E2E8F0] rounded-xl px-4 py-3 bg-white hover:shadow-md transition-shadow">
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{p.address}</p>
                        <p className="text-xs text-[#64748B]">{p.municipality}, {p.department} · {p.type}</p>
                        {p.is_rented && p.tenant_name && (
                          <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                            <UserIcon size={12} />
                            Inquilino: {p.tenant_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${p.is_rented ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {p.is_rented ? 'Arrendado' : 'Disponible'}
                        </span>
                        {userRole === 'OWNER' && p.is_rented && (
                          <Button variant="outline" className="text-xs h-7 px-2">
                            Cambiar Inquilino
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* PERFIL DE USUARIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-5">
            <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#DBEAFE] rounded-xl">
                <UserIcon size={20} className="text-[#2563EB]" />
              </div>
              Mi Perfil
            </h3>
            
            <div className="space-y-3">
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Nombre</p>
                <p className="text-sm font-semibold text-slate-900">{profile?.name || session?.user?.email || 'Usuario'}</p>
              </div>
              
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Email</p>
                <p className="text-sm text-slate-900">{session?.user?.email}</p>
              </div>
              
              <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50">
                <p className="text-[11px] text-slate-500 mb-1">Teléfono</p>
                <p className="text-sm text-slate-900">{profile?.phone || 'No registrado'}</p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="primary" 
                  className="flex-1 text-xs"
                  onClick={() => setShowEditProfileModal(true)}
                >
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs gap-1"
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  <Lock size={14} />
                  Contraseña
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* FORMULARIO TICKET Y LISTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de tickets con búsqueda */}
          <Card className="p-5">
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#D1FAE5] rounded-xl">
                  <Calendar size={20} className="text-[#10B981]" />
                </div>
                Tickets recientes
                <span className="text-sm font-normal text-[#64748B]">
                  ({filteredTickets.length})
                </span>
              </h3>
              
              {/* Search and Filters */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por descripción o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 pl-10 text-xs text-[#1E293B] outline-none focus:border-[#2563EB] transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 pl-9 text-xs text-[#1E293B] outline-none focus:border-[#2563EB] transition-colors"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 pl-9 text-xs text-[#1E293B] outline-none focus:border-[#2563EB] transition-colors"
                    >
                      <option value="all">Todas las prioridades</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {filteredTickets.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center py-8">
                  {tickets.length === 0 ? 'Aún no hay tickets registrados.' : 'No se encontraron tickets con los filtros seleccionados.'}
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-auto pr-1">
                  {filteredTickets.map((t) => {
                    const prop = properties.find((p) => p.id === t.property_id);
                    
                    return (
                      <div
                        key={t.id}
                        className="border border-[#E2E8F0] rounded-xl px-4 py-3 bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-[#1E293B] flex items-center gap-2 text-sm mb-1">
                              <Wrench size={14} />
                              {t.category}
                              <span className="font-normal text-xs text-[#64748B]">· {t.priority}</span>
                            </p>
                            <p className="text-xs text-[#64748B] line-clamp-2 mb-2">
                              {t.description}
                            </p>
                            {prop && (
                              <p className="text-xs text-[#94A3B8]">
                                📍 {prop.address}
                              </p>
                            )}
                            {t.media_urls && t.media_urls.length > 0 && (
                              <MediaViewer mediaUrls={t.media_urls} mediaInfo={t.media_info} />
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={t.status} />
                            <span className="text-xs text-[#94A3B8]">
                              {t.reporter}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            <TopProvidersCard />
            
            {/* Card de perfil simple */}
            <Card className="p-5">
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#DBEAFE] rounded-xl">
                  <UserIcon size={20} className="text-[#2563EB]" />
                </div>
                Mi Perfil
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#64748B]" />
                  <span className="text-sm text-[#1E293B]">{session?.user?.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Home size={16} className="text-[#64748B]" />
                  <StatusBadge status={getRoleLabel(userRole)} />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="primary" className="flex-1 text-xs">
                  Editar Perfil
                </Button>
                <Button variant="outline" className="flex-1 text-xs gap-1">
                  <Lock size={14} />
                  Contraseña
                </Button>
              </div>
            </Card>

            {/* Formulario crear ticket */}
            <Card className="p-5">
              <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#FEF3C7] rounded-xl">
                  <Wrench size={20} className="text-[#F59E0B]" />
                </div>
                Reportar falla
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
          </div>
        </div>

        {/* Formulario agregar propiedad */}
        {userRole === 'OWNER' && (
          <Card id="add-property" className="p-6">
            <h3 className="text-lg font-bold text-[#1E293B] flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#DBEAFE] rounded-xl">
                <Plus size={20} className="text-[#2563EB]" />
              </div>
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

        {/* MODAL: Editar Perfil */}
        {showEditProfileModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditProfileModal(false)}
          >
            <Card 
              className="max-w-md w-full p-6" 
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1E293B]">✏️ Editar Mi Perfil</h3>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Nombre completo"
                  icon={UserIcon}
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e: any) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Tu nombre completo"
                />
                
                <Input
                  label="Teléfono (WhatsApp)"
                  icon={Phone}
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e: any) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Guardando...' : '💾 Guardar'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* MODAL: Cambiar Contraseña */}
        {showChangePasswordModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChangePasswordModal(false)}
          >
            <Card 
              className="max-w-md w-full p-6" 
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1E293B]">🔐 Cambiar Contraseña</h3>
                <button 
                  onClick={() => setShowChangePasswordModal(false)}
                  className="text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Nueva contraseña"
                  icon={Lock}
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e: any) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                
                <Input
                  label="Confirmar nueva contraseña"
                  icon={Lock}
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e: any) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                />
                
                {passwordForm.newPassword && passwordForm.confirmPassword && 
                 passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-[#EF4444]">⚠️ Las contraseñas no coinciden</p>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading || passwordForm.newPassword !== passwordForm.confirmPassword}
                    className="flex-1"
                  >
                    {loading ? 'Cambiando...' : '🔒 Cambiar'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* MODAL: Cambiar Inquilino */}
        {showEditTenantModal && selectedProperty && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditTenantModal(false);
              setSelectedProperty(null);
            }}
          >
            <Card 
              className="max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" 
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1E293B]">👤 Cambiar Inquilino</h3>
                <button 
                  onClick={() => {
                    setShowEditTenantModal(false);
                    setSelectedProperty(null);
                  }}
                  className="text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-[#F8FAFC] rounded-xl">
                <p className="text-xs text-[#64748B] mb-1">Propiedad:</p>
                <p className="text-sm font-semibold text-[#1E293B]">{selectedProperty.address}</p>
                <p className="text-xs text-[#64748B]">{selectedProperty.municipality}, {selectedProperty.department}</p>
              </div>
              
              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <Input
                  label="Nombre del inquilino"
                  icon={UserIcon}
                  type="text"
                  required
                  value={tenantForm.tenantName}
                  onChange={(e: any) => setTenantForm({ ...tenantForm, tenantName: e.target.value })}
                  placeholder="Nombre completo"
                />
                
                <Input
                  label="Email del inquilino"
                  icon={Mail}
                  type="email"
                  required
                  value={tenantForm.tenantEmail}
                  onChange={(e: any) => setTenantForm({ ...tenantForm, tenantEmail: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
                
                <Input
                  label="Teléfono (WhatsApp)"
                  icon={Phone}
                  type="tel"
                  required
                  value={tenantForm.tenantPhone}
                  onChange={(e: any) => setTenantForm({ ...tenantForm, tenantPhone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Inicio contrato"
                    icon={Calendar}
                    type="date"
                    value={tenantForm.contractStart}
                    onChange={(e: any) => setTenantForm({ ...tenantForm, contractStart: e.target.value })}
                  />
                  
                  <Input
                    label="Fin contrato"
                    icon={Calendar}
                    type="date"
                    value={tenantForm.contractEnd}
                    onChange={(e: any) => setTenantForm({ ...tenantForm, contractEnd: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowEditTenantModal(false);
                      setSelectedProperty(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Guardando...' : '💾 Guardar'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}