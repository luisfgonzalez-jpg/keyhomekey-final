'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageCircle, Upload, Send, Image as ImageIcon, X, Clock } from 'lucide-react';
import Image from 'next/image';

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  comment_text: string;
  comment_type: string;
  media_urls?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface TicketTimelineProps {
  ticketId: string;
}

export default function TicketTimeline({ ticketId }: TicketTimelineProps) {
  // Initialize Supabase client with user session (memoized to avoid recreating on every render)
  const supabase = useMemo(() => createClient(), []);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get auth token from localStorage
  const getAuthToken = (): string | null => {
    try {
      const authData = localStorage.getItem('sb-todzeqtqulonaaaqcdtp-auth-token');
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.access_token || null;
    } catch (error) {
      console.error('Error reading auth token:', error);
      return null;
    }
  };

  // Cargar comentarios iniciales
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch(`/api/tickets/${ticketId}/comments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch comments');
        }

        const data = await response.json();
        
        if (data.success) {
          setComments(data.comments);
        } else if (Array.isArray(data)) {
          // Handle case where API returns array directly
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [ticketId]);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel(`ticket_comments:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments((prev) => [payload.new as Comment, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComments((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Comment) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Crear preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      // Use crypto.randomUUID() for secure unique file names
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${ticketId}/${fileName}`;

      const { error } = await supabase.storage
        .from('tickets-media')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        continue;
      }

      const urlData = supabase.storage
        .from('tickets-media')
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() && selectedFiles.length === 0) return;

    setLoading(true);
    setUploading(selectedFiles.length > 0);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        setLoading(false);
        setUploading(false);
        return;
      }

      let media_urls: string[] = [];

      // Upload files first
      if (selectedFiles.length > 0) {
        media_urls = await uploadFiles(selectedFiles);
      }

      // Create comment
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_text: newComment || 'Archivos adjuntos',
          media_urls,
          comment_type: selectedFiles.length > 0 ? 'media_added' : 'comment',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create comment');
      }

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setError(null);
      } else {
        console.error('Error creating comment:', data.error);
        setError(`Error al agregar comentario: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al agregar comentario: ${errorMessage}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-blue-100 text-blue-800';
      case 'TENANT':
        return 'bg-green-100 text-green-800';
      case 'PROVIDER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Propietario';
      case 'TENANT':
        return 'Inquilino';
      case 'PROVIDER':
        return 'Proveedor';
      default:
        return role;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Timeline de Actividad
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Historial de comentarios y actualizaciones
          </p>
        </div>

        {/* Form for new comment */}
        <div className="border-b border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <X className="w-5 h-5" />
                <p className="flex-1">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* File previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Adjuntar archivos</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || (!newComment.trim() && selectedFiles.length === 0)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments timeline */}
        <div className="divide-y divide-gray-200">
          {comments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay comentarios todavía</p>
              <p className="text-sm mt-2">Sé el primero en comentar</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {comment.user_name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          comment.user_role
                        )}`}
                      >
                        {getRoleLabel(comment.user_role)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap mb-3">
                      {comment.comment_text}
                    </p>

                    {/* Media attachments */}
                    {comment.media_urls && comment.media_urls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {comment.media_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
