'use client';

import React, { useState } from 'react';
import { Star, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface TicketApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApprovalData) => Promise<void>;
  action: 'approve' | 'reject';
  ticketId: string;
}

export interface ApprovalData {
  action: 'approved' | 'rejected';
  rating?: number;
  qualityScore?: number;
  punctualityScore?: number;
  comment?: string;
  evidencePhotos?: string[];
}

export default function TicketApprovalModal({
  isOpen,
  onClose,
  onSubmit,
  action,
  ticketId,
}: TicketApprovalModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [punctualityScore, setPunctualityScore] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Create preview URLs
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

  const validateForm = (): boolean => {
    setError(null);

    if (action === 'approve') {
      if (rating === 0) {
        setError('Por favor califica el servicio (obligatorio)');
        return false;
      }
    } else {
      // action === 'reject'
      if (!comment.trim()) {
        setError('Debes proporcionar un comentario al rechazar el trabajo');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload evidence photos if any
      const evidenceUrls: string[] = [];
      if (selectedFiles.length > 0) {
        // TODO: Implement file upload to Supabase storage
        // For now, we'll pass empty array
      }

      const approvalData: ApprovalData = {
        action: action === 'approve' ? 'approved' : 'rejected',
        rating: action === 'approve' ? rating : undefined,
        qualityScore: qualityScore > 0 ? qualityScore : undefined,
        punctualityScore: punctualityScore > 0 ? punctualityScore : undefined,
        comment: comment.trim() || undefined,
        evidencePhotos: evidenceUrls,
      };

      await onSubmit(approvalData);
      
      // Reset form
      setRating(0);
      setQualityScore(0);
      setPunctualityScore(0);
      setComment('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al procesar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({
    label,
    value,
    onChange,
    required = false,
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    required?: boolean;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={
                star <= value
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              }
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-lg font-semibold text-gray-700">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {action === 'approve' ? '✅ Aprobar Trabajo' : '❌ Rechazar Trabajo'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating - Only for approval */}
              {action === 'approve' && (
                <>
                  <StarRating
                    label="Calificación General"
                    value={rating}
                    onChange={setRating}
                    required={true}
                  />

                  <StarRating
                    label="Calidad del Trabajo"
                    value={qualityScore}
                    onChange={setQualityScore}
                  />

                  <StarRating
                    label="Puntualidad"
                    value={punctualityScore}
                    onChange={setPunctualityScore}
                  />
                </>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario{' '}
                  {action === 'reject' && <span className="text-red-500">*</span>}
                  {action === 'approve' && (
                    <span className="text-gray-500 font-normal">(opcional pero recomendado)</span>
                  )}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    action === 'approve'
                      ? 'Describe lo que te gustó del trabajo...'
                      : 'Describe qué necesita corregirse...'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={loading}
                />
              </div>

              {/* Evidence photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos de Evidencia <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Nota: La función de subida de fotos se implementará próximamente.
                </p>
                
                {/* File previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Temporarily disabled until upload is implemented
                <input
                  type="file"
                  id="evidence-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="evidence-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir fotos</span>
                </label>
                */}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      {action === 'approve' ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Aprobar</span>
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          <span>Rechazar</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
