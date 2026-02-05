'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, MapPin, User, Calendar, Wrench, AlertCircle, FileText, Edit } from 'lucide-react';
import Link from 'next/link';
import TicketTimeline from '@/components/TicketTimeline';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface TicketDetail {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  reporter: string;
  reported_by_email?: string;
  assigned_provider_id?: string;
  assigned_provider_name?: string;
  media_urls?: string[];
  media_info?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  property: {
    id: string;
    address: string;
    department: string;
    municipality: string;
    property_type: string;
  };
}

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const supabase = createClient();
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          properties:property_id (
            id,
            address,
            department,
            municipality,
            property_type
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;

      const ticketData = {
        ...data,
        property: data.properties || {
          id: '',
          address: 'N/A',
          department: 'N/A',
          municipality: 'N/A',
          property_type: 'N/A'
        }
      };

      setTicket(ticketData);
      setEditStatus(ticketData.status);
    } catch (error) {
      console.error('Error loading ticket:', error);
      alert('Error al cargar el ticket');
      router.push('/admin/tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: editStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) throw error;

      alert('Estado actualizado correctamente');
      setIsEditing(false);
      await loadTicket();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`Error: ${error.message}`);
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getPriorityBadgeColor(priority: string) {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Media':
        return 'bg-orange-100 text-orange-800';
      case 'Baja':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket no encontrado</p>
          <Link
            href="/admin/tickets"
            className="text-blue-600 hover:text-blue-800 mt-4 inline-block"
          >
            Volver a tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tickets"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Ticket</h1>
            <p className="text-sm text-gray-600 mt-1 font-mono">ID: {ticket.id}</p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Edit size={18} />
            Editar Estado
          </button>
        )}
      </div>

      {/* Edit Status Modal */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Cambiar estado:
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditStatus(ticket.status);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Ticket</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Categoría</div>
                  <div className="text-base font-medium text-gray-900">{ticket.category}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500 mb-2">Descripción</div>
                <div className="text-base text-gray-900">{ticket.description}</div>
              </div>

              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Estado</div>
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Prioridad</div>
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getPriorityBadgeColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500">Creado</div>
                    <div className="text-sm text-gray-900">{formatDate(ticket.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500">Actualizado</div>
                    <div className="text-sm text-gray-900">{formatDate(ticket.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          {ticket.media_urls && ticket.media_urls.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos Adjuntos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ticket.media_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition"
                  >
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad del Ticket</h2>
            <TicketTimeline ticketId={ticket.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Propiedad</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{ticket.property.address}</div>
                  <div className="text-sm text-gray-500">
                    {ticket.property.municipality}, {ticket.property.department}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="text-sm text-gray-500">Tipo de propiedad</div>
                <div className="text-sm font-medium text-gray-900">{ticket.property.property_type}</div>
              </div>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reportado por</h2>
            <div className="flex items-start gap-2">
              <User size={16} className="text-gray-400 mt-1" />
              <div>
                <div className="text-sm font-medium text-gray-900">{ticket.reporter}</div>
                {ticket.reported_by_email && (
                  <div className="text-sm text-gray-500">{ticket.reported_by_email}</div>
                )}
              </div>
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Proveedor Asignado</h2>
            {ticket.assigned_provider_name ? (
              <div className="flex items-start gap-2">
                <Wrench size={16} className="text-gray-400 mt-1" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {ticket.assigned_provider_name}
                  </div>
                  <div className="text-sm text-gray-500">{ticket.category}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-gray-500">
                <AlertCircle size={16} className="mt-1" />
                <div className="text-sm">Sin proveedor asignado</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
