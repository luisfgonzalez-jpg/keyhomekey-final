'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MapPin, Wrench, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface TicketDetail {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_provider_name?: string;
  media_urls?: string[];
  properties?: {
    address: string;
    department: string;
    municipality: string;
  };
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    'Asignado': 'bg-blue-100 text-blue-800',
    'En progreso': 'bg-yellow-100 text-yellow-800',
    'Completado': 'bg-green-100 text-green-800',
    'Resuelto': 'bg-green-100 text-green-800',
    'Rechazado': 'bg-red-100 text-red-800',
    'Pendiente': 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export default function ProviderTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => {
      setTicketId(id);
      loadTicket(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTicket(id: string) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tickets')
        .select(`
          id,
          category,
          description,
          status,
          priority,
          created_at,
          assigned_provider_name,
          media_urls,
          properties!property_id (
            address,
            department,
            municipality
          )
        `)
        .eq('id', id)
        .single();

      setTicket(data as unknown as TicketDetail);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/provider/tickets/${ticketId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadTicket(ticketId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm('¿Estás seguro de rechazar este ticket?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/provider/tickets/${ticketId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadTicket(ticketId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidencePhotos: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadTicket(ticketId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Ticket no encontrado</p>
          <Link href="/provider" className="text-blue-600 hover:underline text-sm">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/provider"
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-900">Detalle del Ticket</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{ticket.category}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(ticket.created_at).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>

          {ticket.properties && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
              <MapPin size={14} />
              <span>{ticket.properties.address} – {ticket.properties.municipality}, {ticket.properties.department}</span>
            </div>
          )}

          <div className="mb-4">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
              ticket.priority === 'Alta' ? 'bg-red-100 text-red-700' :
              ticket.priority === 'Media' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              <Clock size={11} />
              Prioridad {ticket.priority}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
          </div>

          {ticket.media_urls && ticket.media_urls.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Archivos adjuntos</p>
              <div className="flex flex-wrap gap-2">
                {ticket.media_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-200 rounded px-2 py-1"
                  >
                    Archivo {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {ticket.status === 'Asignado' && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle size={16} />
                  Aceptar
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm rounded-xl hover:bg-red-50 disabled:opacity-60"
                >
                  <XCircle size={16} />
                  Rechazar
                </button>
              </>
            )}
            {ticket.status === 'En progreso' && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60"
              >
                <CheckCircle size={16} />
                Marcar completado
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
