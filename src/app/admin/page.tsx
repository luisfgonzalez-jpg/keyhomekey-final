'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Ticket, Clock, CheckCircle2, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Stats {
  totalTickets: number;
  pendingTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  activeProviders: number;
  ticketsByStatus: { name: string; value: number }[];
  ticketsByCategory: { name: string; value: number }[];
  ticketsByPriority: { Alta: number; Media: number; Baja: number };
}

const STATUS_COLORS = {
  Pendiente: '#F59E0B',
  'En proceso': '#3B82F6',
  Completado: '#10B981',
};

const PRIORITY_COLORS = {
  Alta: '#EF4444',
  Media: '#F59E0B',
  Baja: '#6B7280',
};

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    pendingTickets: 0,
    inProgressTickets: 0,
    completedTickets: 0,
    activeProviders: 0,
    ticketsByStatus: [],
    ticketsByCategory: [],
    ticketsByPriority: { Alta: 0, Media: 0, Baja: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    try {
      // Get total tickets count
      const { count: totalTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

      // Get all tickets for detailed stats
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status, category, priority');

      // Count tickets by status
      const pendingTickets = tickets?.filter(t => t.status === 'Pendiente').length || 0;
      const inProgressTickets = tickets?.filter(t => t.status === 'En proceso').length || 0;
      const completedTickets = tickets?.filter(t => t.status === 'Completado').length || 0;

      // Get tickets by status for pie chart
      const statusCounts = tickets?.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ticketsByStatus = Object.entries(statusCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));

      // Get tickets by category for bar chart
      const categoryCounts = tickets?.reduce((acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ticketsByCategory = Object.entries(categoryCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));

      // Get tickets by priority
      const priorityCounts = tickets?.reduce((acc, ticket) => {
        const priority = ticket.priority as 'Alta' | 'Media' | 'Baja';
        if (priority === 'Alta' || priority === 'Media' || priority === 'Baja') {
          acc[priority] = (acc[priority] || 0) + 1;
        }
        return acc;
      }, { Alta: 0, Media: 0, Baja: 0 }) || { Alta: 0, Media: 0, Baja: 0 };

      // Get active providers count
      const { count: activeProviders } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalTickets: totalTickets || 0,
        pendingTickets,
        inProgressTickets,
        completedTickets,
        activeProviders: activeProviders || 0,
        ticketsByStatus,
        ticketsByCategory,
        ticketsByPriority: priorityCounts,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const priorityData = [
    { name: 'Alta', value: stats.ticketsByPriority.Alta, color: PRIORITY_COLORS.Alta },
    { name: 'Media', value: stats.ticketsByPriority.Media, color: PRIORITY_COLORS.Media },
    { name: 'Baja', value: stats.ticketsByPriority.Baja, color: PRIORITY_COLORS.Baja },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Administración</h1>
        <p className="text-sm text-gray-600 mt-1">
          Vista general del sistema KeyHomeKey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
          <div className="text-sm text-gray-600">Total Tickets</div>
        </div>

        {/* Pending Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingTickets}</div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>

        {/* In Progress Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</div>
          <div className="text-sm text-gray-600">En Proceso</div>
        </div>

        {/* Completed Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.completedTickets}</div>
          <div className="text-sm text-gray-600">Completados</div>
        </div>

        {/* Active Providers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeProviders}</div>
          <div className="text-sm text-gray-600">Proveedores Activos</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets por Estado</h2>
          {stats.ticketsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.ticketsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Tickets by Category - Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets por Categoría</h2>
          {stats.ticketsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ticketsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Priority Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets por Prioridad</h2>
        {priorityData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/tickets"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestionar Tickets</h3>
              <p className="text-sm text-gray-600">
                Ver y administrar todos los tickets del sistema
              </p>
            </div>
            <ArrowRight size={24} className="text-gray-400" />
          </div>
        </Link>

        <Link
          href="/admin/providers"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestionar Proveedores</h3>
              <p className="text-sm text-gray-600">
                Administrar proveedores de servicios
              </p>
            </div>
            <ArrowRight size={24} className="text-gray-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}
