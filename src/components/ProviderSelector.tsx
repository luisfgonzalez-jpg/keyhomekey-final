'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Wrench, CheckCircle, Search, Loader2 } from 'lucide-react';

// Constant for external provider identifier
export const EXTERNAL_PROVIDER_ID = 'external';

interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  specialty: string;
  department: string;
  municipality: string;
}

interface ProviderSelectorProps {
  category: string;
  department: string;
  municipality: string;
  onProviderSelect: (providerId: string | null, providerName: string, isExternal: boolean) => void;
  selectedProviderId: string | null;
}

type ProviderType = 'internal' | 'external';

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  category,
  department,
  municipality,
  onProviderSelect,
  selectedProviderId,
}) => {
  const [providerType, setProviderType] = useState<ProviderType>('internal');
  const [internalProviders, setInternalProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [externalSearching, setExternalSearching] = useState(false);

  // Fetch internal providers when category or location changes
  useEffect(() => {
    if (!category || !department || !municipality) {
      return;
    }

    // Reset selection when filters change
    onProviderSelect(null, '', false);
    setExternalSearching(false);

    const fetchInternalProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          category,
          department,
          municipality,
        });

        const response = await fetch(`/api/providers/available?${params.toString()}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Error fetching providers');
        }

        setInternalProviders(data.providers || []);
      } catch (err: unknown) {
        console.error('Error fetching providers:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar proveedores');
      } finally {
        setLoading(false);
      }
    };

    fetchInternalProviders();
  }, [category, department, municipality, onProviderSelect]);

  // Handle provider type change
  const handleProviderTypeChange = (type: ProviderType) => {
    setProviderType(type);
    setExternalSearching(false);
    // Reset selection when switching types
    onProviderSelect(null, '', type === 'external');
  };

  // Handle internal provider selection
  const handleInternalProviderSelect = (provider: Provider) => {
    onProviderSelect(provider.id, provider.full_name, false);
  };

  // Handle external provider search
  const handleExternalSearch = () => {
    setExternalSearching(true);
    // Trigger external provider search logic
    // For now, we'll allow the user to proceed with external provider selection
    onProviderSelect(EXTERNAL_PROVIDER_ID, 'Proveedor Externo (Google)', true);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-medium text-[#64748B] mb-2">
          Tipo de Proveedor <span className="text-[#EF4444]">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="providerType"
              value="internal"
              checked={providerType === 'internal'}
              onChange={() => handleProviderTypeChange('internal')}
              className="w-4 h-4 text-[#2563EB] border-[#E2E8F0] focus:ring-[#2563EB]"
            />
            <span className="text-xs text-[#1E293B] font-medium">Proveedores Internos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="providerType"
              value="external"
              checked={providerType === 'external'}
              onChange={() => handleProviderTypeChange('external')}
              className="w-4 h-4 text-[#2563EB] border-[#E2E8F0] focus:ring-[#2563EB]"
            />
            <span className="text-xs text-[#1E293B] font-medium">Proveedores Externos</span>
          </label>
        </div>
      </div>

      {providerType === 'internal' && (
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#2563EB]" size={24} />
              <span className="ml-2 text-xs text-[#64748B]">Cargando proveedores...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FEE2E2] border border-[#EF4444] rounded-xl">
              <p className="text-xs text-[#DC2626]">{error}</p>
            </div>
          )}

          {!loading && !error && internalProviders.length === 0 && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
              <p className="text-xs text-[#64748B]">
                No hay proveedores internos disponibles para esta categoría y ubicación.
              </p>
              <p className="text-xs text-[#64748B] mt-2">
                Puedes seleccionar &quot;Proveedores Externos&quot; para buscar en Google.
              </p>
            </div>
          )}

          {!loading && !error && internalProviders.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {internalProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => handleInternalProviderSelect(provider)}
                  className={`
                    relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md
                    ${
                      selectedProviderId === provider.id
                        ? 'border-[#2563EB] bg-[#EFF6FF]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8]'
                    }
                  `}
                >
                  {selectedProviderId === provider.id && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="text-[#2563EB]" size={20} />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-[#1E293B] pr-8">
                      {provider.full_name}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Wrench size={14} />
                      <span>{provider.specialty}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <MapPin size={14} />
                      <span>{provider.municipality}, {provider.department}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Phone size={14} />
                      <span>{provider.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {providerType === 'external' && (
        <div className="space-y-3">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <p className="text-xs text-[#64748B] mb-3">
              Se buscará un proveedor externo usando Google Places para la categoría{' '}
              <span className="font-semibold">{category}</span> en{' '}
              <span className="font-semibold">{municipality}, {department}</span>.
            </p>
            
            <button
              type="button"
              onClick={handleExternalSearch}
              disabled={externalSearching}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                text-xs font-semibold transition-all
                ${
                  externalSearching
                    ? 'bg-[#94A3B8] text-white cursor-not-allowed'
                    : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2'
                }
              `}
            >
              {externalSearching ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Buscar Proveedor Externo
                </>
              )}
            </button>
          </div>
          
          {externalSearching && (
            <div className="p-3 bg-[#D1FAE5] border border-[#34D399] rounded-xl">
              <p className="text-xs text-[#065F46]">
                ✓ Se buscará un proveedor externo al crear el ticket
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderSelector;
