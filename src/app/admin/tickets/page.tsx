'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Filter, Eye, Calendar, MapPin, User, Wrench, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  reporter: string;
  reported_by_email?: string;
  assigned_provider_id?: string;
  assigned_provider_name?: string;
  property: {
    address: string;
    department: string;
    municipality: string;
  };
}

const CATEGORIES = [
  'Plomería',
  'Eléctrico',
  'Carpintería',
  'Pintura',
  'Cerrajería',
  'Jardinería',
  'Limpieza',
  'Aire Acondicionado',
  'Gas',
  'Albañilería',
  'Herrería',
  'Vidriería',
  'Electrodomésticos',
  'Otros'
];

export default function AdminTicketsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.id.toLowerCase().includes(query) ||
          t.property?.address?.toLowerCase().includes(query) ||
          t.reporter?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tickets, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  async function loadTickets() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          properties!property_id (
            address,
            department,
            municipality
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Tickets loaded successfully:', data?.length || 0);

      // Transform data to match our interface
      const transformedTickets = data?.map(ticket => ({
        ...ticket,
        property: ticket.properties || {
          address: 'N/A',
          department: 'N/A',
          municipality: 'N/A'
        }
      })) || [];

      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Asignado':
        return 'bg-purple-100 text-purple-800';
      case 'En progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'Resuelto':
        return 'bg-emerald-100 text-emerald-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      // Soporte para estado antiguo
      case 'En proceso':
        return 'bg-blue-100 text-blue-800';
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
      month: 'short',
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets</h1>
        <p className="text-sm text-gray-600 mt-1">
          Administra todos los tickets del sistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, dirección o reportero..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Asignado">Asignado</option>
              <option value="En progreso">En progreso</option>
              <option value="Completado">Completado</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{filteredTickets.length}</span> de{' '}
            <span className="font-semibold">{tickets.length}</span> tickets
          </p>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reportado por
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado a
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                    No se encontraron tickets con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-xs text-gray-500 font-mono">
                          {ticket.id.substring(0, 8)}...
                        </div>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          {ticket.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {ticket.property?.address || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.property?.municipality}, {ticket.property?.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-gray-900">{ticket.reporter}</div>
                          {ticket.reported_by_email && (
                            <div className="text-xs text-gray-500">{ticket.reported_by_email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {ticket.assigned_provider_name ? (
                        <div className="flex items-center gap-2">
                          <Wrench size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {ticket.assigned_provider_name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">No asignado</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
