'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { colombiaLocations } from '@/lib/colombiaData';
import { User, Plus, Trash2, Edit2, Save, X, Phone, MapPin, Wrench } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Provider {
  id: string;
  user_id: string;
  phone: string;
  specialty: string;
  department: string;
  municipality: string;
  is_active: boolean;
  created_at?: string;
  user_name?: string;
  user_email?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

const SPECIALTIES = [
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

export default function ProvidersPage() {
  const supabase = createClient();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    user_id: '',
    phone: '',
    specialty: 'Plomería',
    department: '',
    municipality: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.department) {
      const found = colombiaLocations.find((d) => d.departamento === formData.department);
      const cities = found?.ciudades || [];
      setAvailableCities(cities);
      if (!cities.includes(formData.municipality)) {
        setFormData(prev => ({ ...prev, municipality: cities[0] || '' }));
      }
    } else {
      setAvailableCities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department]);

  async function loadData() {
    try {
      await loadProviders();
      await loadUsers();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProviders() {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading providers:', error);
      return;
    }

    // Enrich with user data from users_profiles
    const enrichedProviders = await Promise.all(
      (data || []).map(async (provider) => {
        const { data: userProfile } = await supabase
          .from('users_profiles')
          .select('name, email')
          .eq('user_id', provider.user_id)
          .maybeSingle();

        return {
          ...provider,
          user_name: userProfile?.name || 'Sin nombre',
          user_email: userProfile?.email || 'Sin email',
        };
      })
    );

    setProviders(enrichedProviders);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('users_profiles')
      .select('user_id, email, name, role')
      .eq('role', 'PROVIDER')
      .order('name');

    // Map user_id to id for consistency with interface
    const mappedUsers = (data || []).map(user => ({
      id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    }));

    setUsers(mappedUsers);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.user_id || !formData.phone || !formData.department || !formData.municipality) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('providers')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        alert('Proveedor actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('providers')
          .insert([formData]);

        if (error) throw error;
        alert('Proveedor agregado correctamente');
      }

      resetForm();
      await loadProviders();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de desactivar este proveedor?')) return;

    try {
      // Soft delete: set is_active to false
      const { error } = await supabase
        .from('providers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      alert('Proveedor desactivado');
      await loadProviders();
    } catch (error: any) {
      console.error('Error deactivating provider:', error);
      alert(`Error: ${error.message}`);
    }
  }

  function handleEdit(provider: Provider) {
    setFormData({
      user_id: provider.user_id,
      phone: provider.phone,
      specialty: provider.specialty,
      department: provider.department,
      municipality: provider.municipality,
      is_active: provider.is_active,
    });
    setEditingId(provider.id);
    setShowAddForm(true);
  }

  function resetForm() {
    setFormData({
      user_id: '',
      phone: '',
      specialty: 'Plomería',
      department: '',
      municipality: '',
      is_active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
            <p className="text-sm text-gray-600 mt-1">
              Administra los proveedores de servicios del sistema
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
            {showAddForm ? 'Cancelar' : 'Agregar Proveedor'}
          </button>
        </div>

        {/* Formulario */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario (Proveedor)
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="3001234567"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona departamento</option>
                  {colombiaLocations.map((loc) => (
                    <option key={loc.departamento} value={loc.departamento}>{loc.departamento}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio
                </label>
                <select
                  value={formData.municipality}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipality: e.target.value }))}
                  required
                  disabled={!formData.department}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Selecciona municipio</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Proveedor activo</span>
                </label>
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Save size={18} />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de proveedores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No hay proveedores registrados. Haz clic en "Agregar Proveedor" para comenzar.
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{provider.user_name}</div>
                            <div className="text-sm text-gray-500">{provider.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Phone size={14} />
                          {provider.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Wrench size={14} />
                          {provider.specialty}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin size={14} />
                          <div>
                            <div>{provider.municipality}</div>
                            <div className="text-xs text-gray-500">{provider.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          provider.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {provider.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(provider)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(provider.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
