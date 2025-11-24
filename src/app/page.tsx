'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
// 👇 Importamos la lista de Colombia que acabas de crear
import { colombiaLocations } from '@/lib/colombiaData'; 

import { 
  Home, User, Wrench, MapPin, Plus, CheckCircle, 
  AlertTriangle, Truck, UserCheck, LogOut, 
  MessageCircle, Calendar, Mail, Lock, Phone, Send, FileText
} from 'lucide-react';

const KEYHOME_WHATSAPP = "573001234567"; 

// --- COMPONENTES UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const baseStyle = "px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md";
  const variants: any = {
    primary: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    purple: "bg-purple-600 text-white hover:bg-purple-700"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>{children}</div>
);

const Input = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={20} /></div>
    <input {...props} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white"/>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    'Pendiente': { color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'Asignado': { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'En Camino': { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'En Sitio': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'Resuelto': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  };
  const style = config[status] || config['Pendiente'];
  return <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit border ${style.color}`}>{status}</span>;
};

// --- APP PRINCIPAL ---
export default function KeyhomeKeyApp() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null); 
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Auth
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Formulario Propiedad (NUEVOS CAMPOS)
  const [newProp, setNewProp] = useState({ 
    address: '', 
    department: '',       // Nuevo
    municipality: '',     // Nuevo
    ownerPhone: '',       // Nuevo
    type: 'Apartamento', 
    isRented: false, 
    tenantName: '', 
    tenantEmail: '', 
    tenantPhone: '',      // Nuevo
    contractStart: '', 
    contractEnd: '' 
  });
  
  // Estado para guardar las ciudades del departamento seleccionado
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [newTicket, setNewTicket] = useState({ propertyId: '', category: 'Plomería', description: '', priority: 'Media', providerOption: 'KeyhomeKey' });

  // Inicialización
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await detectRoleAndRedirect(session.user.email, session.user.id);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setView('login');
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Lógica Inteligente de Ubicación ---
  useEffect(() => {
    if (newProp.department) {
      // Buscamos las ciudades del departamento seleccionado en tu archivo colombiaData
      const deptData = colombiaLocations.find(d => d.departamento === newProp.department);
      
      if (deptData) {
        setAvailableCities(deptData.ciudades);
        
        // Si es Bogotá, autoseleccionar el municipio
        if (newProp.department === 'Bogotá D.C.') {
          setNewProp(prev => ({ ...prev, municipality: 'Bogotá D.C.' }));
        } else {
          setNewProp(prev => ({ ...prev, municipality: '' })); // Resetear si cambia
        }
      }
    } else {
      setAvailableCities([]);
    }
  }, [newProp.department]);


  // --- Lógica de Roles ---
  const detectRoleAndRedirect = async (email: string | undefined, userId: string) => {
    if (!email) return;
    setLoading(true);

    const { data: tenantProp } = await supabase.from('properties').select('id').eq('tenant_email', email).maybeSingle();

    if (tenantProp) {
      setUserRole('tenant');
      setView('tenant-home');
      fetchData('tenant', email, userId);
    } else {
      setUserRole('owner');
      setView('owner-home');
      fetchData('owner', email, userId);
    }
  };

  const fetchData = async (role: string, userEmail: string, userId: string) => {
    setLoading(true);
    let propsQuery = supabase.from('properties').select('*').order('created_at', { ascending: false });
    let ticketsQuery = supabase.from('tickets').select('*').order('created_at', { ascending: false });

    if (role === 'owner') propsQuery = propsQuery.eq('owner_id', userId); 
    else if (role === 'tenant') propsQuery = propsQuery.eq('tenant_email', userEmail);

    const { data: propsData } = await propsQuery;
    if (propsData) setProperties(propsData || []);

    const { data: ticketsData } = await ticketsQuery;
    if (ticketsData) setTickets(ticketsData || []);
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Registro exitoso. ¡Inicia sesión!');
      setLoading(false);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { alert(error.message); setLoading(false); }
      else if (data.session) detectRoleAndRedirect(data.session.user.email, data.session.user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('login');
    setUserRole(null);
  };

  const addProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('properties').insert([{
      owner_id: session?.user?.id, 
      address: newProp.address,
      department: newProp.department, // Nuevo
      municipality: newProp.municipality, // Nuevo
      owner_phone: newProp.ownerPhone, // Nuevo
      type: newProp.type,
      is_rented: newProp.isRented,
      tenant_name: newProp.isRented ? newProp.tenantName : null,
      tenant_email: newProp.isRented ? newProp.tenantEmail : null,
      tenant_phone: newProp.isRented ? newProp.tenantPhone : null, // Nuevo
      contract_start_date: newProp.isRented ? newProp.contractStart : null,
      contract_end_date: newProp.isRented ? newProp.contractEnd : null
    }]);

    if (error) alert("Error al guardar: " + error.message);
    else {
      if (newProp.isRented && newProp.tenantEmail) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newProp.tenantEmail, name: newProp.tenantName, type: 'invitation' })
          });
          alert("✅ Guardado y correo enviado.");
        } catch (err: any) {
          alert(`⚠️ Guardado, error correo: ${err.message}`);
        }
      } else {
        alert("✅ Propiedad guardada exitosamente.");
      }
      // Limpiar formulario
      setNewProp({ 
        address: '', department: '', municipality: '', ownerPhone: '', 
        type: 'Apartamento', isRented: false, tenantName: '', 
        tenantEmail: '', tenantPhone: '', contractStart: '', contractEnd: '' 
      });
      setView('owner-home');
      fetchData('owner', session.user.email, session.user.id); 
    }
    setLoading(false);
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('tickets').insert([{
      property_id: Number(newTicket.propertyId),
      category: newTicket.category,
      description: newTicket.description,
      priority: newTicket.priority,
      provider_option: newTicket.providerOption,
      reporter: userRole === 'owner' ? 'Propietario' : 'Inquilino',
      status: 'Pendiente'
    }]);

    if (error) alert("Error: " + error.message);
    else {
      // Lógica de Proveedor (WhatsApp) - Aquí usamos la ubicación guardada
      const prop = properties.find(p => p.id == newTicket.propertyId);
      
      // Mensaje inteligente con ubicación
      const text = `Hola, NUEVO SERVICIO REQUERIDO:\n🏠 *Ubicación:* ${prop?.address}, ${prop?.municipality} (${prop?.department})\n🔧 *Servicio:* ${newTicket.category}\n📝 *Detalle:* ${newTicket.description}\n🚨 *Prioridad:* ${newTicket.priority}`;
      
      window.open(`https://wa.me/${KEYHOME_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
      
      alert("Ticket creado y proveedor notificado.");
      setView(userRole === 'owner' ? 'owner-home' : 'tenant-home');
      fetchData(userRole!, session.user.email, session.user.id);
    }
    setLoading(false);
  };

  // --- VISTAS ---

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Home className="text-white" size={32}/></div>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">KeyhomeKey</h1>
          <Card className="p-8">
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setAuthMode('signin')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'signin' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Ingresar</button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Registro</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input icon={Mail} type="email" placeholder="Email" required value={email} onChange={(e:any) => setEmail(e.target.value)} />
              <Input icon={Lock} type="password" placeholder="Contraseña" required value={password} onChange={(e:any) => setPassword(e.target.value)} />
              <Button disabled={loading} type="submit" className="w-full mt-4">{loading ? '...' : (authMode === 'signin' ? 'Entrar' : 'Crear Cuenta')}</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'add-property') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans">
        <div className="max-w-lg mx-auto">
          <Button onClick={() => setView('owner-home')} variant="secondary" className="mb-6">← Volver</Button>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Nueva Propiedad</h2>
            <form onSubmit={addProperty} className="space-y-4">
              
              {/* DATOS DE UBICACIÓN */}
              <Input icon={MapPin} required placeholder="Dirección exacta" value={newProp.address} onChange={(e:any) => setNewProp({...newProp, address: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">Departamento</label>
                  <select required className="w-full p-3 border rounded-xl bg-white mt-1" value={newProp.department} onChange={(e:any) => setNewProp({...newProp, department: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {colombiaLocations.map(d => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1">Municipio</label>
                  <select required className="w-full p-3 border rounded-xl bg-white mt-1" disabled={!newProp.department} value={newProp.municipality} onChange={(e:any) => setNewProp({...newProp, municipality: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <Input icon={Phone} required placeholder="Teléfono Propietario (WhatsApp)" value={newProp.ownerPhone} onChange={(e:any) => setNewProp({...newProp, ownerPhone: e.target.value})} />

              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <select className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50" value={newProp.type} onChange={(e:any) => setNewProp({...newProp, type: e.target.value})}>
                  <option>Apartamento</option><option>Casa</option><option>Local</option>
                </select>
              </div>

              {/* SECCIÓN ARRIENDO */}
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <label className="flex items-center gap-3 font-bold text-indigo-900 cursor-pointer mb-3">
                  <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={newProp.isRented} onChange={(e:any) => setNewProp({...newProp, isRented: e.target.checked})} /> En Arriendo
                </label>
                {newProp.isRented && (
                  <div className="space-y-3 pl-2 border-l-2 border-indigo-200 animate-in slide-in-from-top-2">
                    <Input icon={User} required placeholder="Nombre Inquilino" value={newProp.tenantName} onChange={(e:any) => setNewProp({...newProp, tenantName: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input icon={Mail} required type="email" placeholder="Email Inquilino" value={newProp.tenantEmail} onChange={(e:any) => setNewProp({...newProp, tenantEmail: e.target.value})} />
                      <Input icon={Phone} required type="tel" placeholder="Tel Inquilino" value={newProp.tenantPhone} onChange={(e:any) => setNewProp({...newProp, tenantPhone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-xs text-indigo-600 font-bold">Inicio Contrato</span><input type="date" className="w-full p-2 rounded border" required value={newProp.contractStart} onChange={(e:any) => setNewProp({...newProp, contractStart: e.target.value})} /></div>
                      <div><span className="text-xs text-indigo-600 font-bold">Fin Contrato</span><input type="date" className="w-full p-2 rounded border" required value={newProp.contractEnd} onChange={(e:any) => setNewProp({...newProp, contractEnd: e.target.value})} /></div>
                    </div>
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex items-center gap-2"><Send size={14}/> Se enviará la invitación al inquilino.</div>
                  </div>
                )}
              </div>
              <Button disabled={loading} type="submit" className="w-full">Guardar Propiedad</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'owner-home') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="font-bold text-xl text-indigo-700">KeyhomeKey</div>
          <button onClick={handleLogout}><LogOut size={20} className="text-slate-400"/></button>
        </nav>
        <main className="p-4 max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center mt-4">
            <h2 className="text-xl font-bold text-slate-800">Mis Propiedades</h2>
            <Button onClick={() => setView('add-property')} className="text-sm"><Plus size={18}/> Agregar</Button>
          </div>
          {properties.length === 0 && !loading && <p className="text-center text-slate-400 py-10">No tienes propiedades.</p>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(p => (
              <Card key={p.id} className="relative p-5 hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 h-full w-1 ${p.is_rented ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <h3 className="font-bold text-lg">{p.address}</h3>
                <p className="text-slate-500 text-sm mb-2 flex items-center gap-1"><MapPin size={12}/> {p.municipality}, {p.department}</p>
                {p.is_rented ? (
                  <div className="bg-emerald-50 p-2 rounded text-xs text-emerald-800 border border-emerald-100">
                    <p className="font-bold flex gap-1"><UserCheck size={12}/> {p.tenant_name}</p>
                    <p className="opacity-75">Vence: {p.contract_end_date}</p>
                  </div>
                ) : <div className="bg-slate-50 p-2 rounded text-center text-xs text-slate-400">Vacante</div>}
              </Card>
            ))}
          </div>
          <div className="pt-6 border-t"><h2 className="text-xl font-bold text-slate-800 mb-4">Novedades</h2><Button onClick={() => setView('create-ticket')} className="bg-amber-100 text-amber-700 text-sm mb-4">Reportar Daño</Button>
             <div className="space-y-3">
               {tickets.map(t => (
                  <Card key={t.id} className="p-4 flex justify-between items-center">
                    <div><h4 className="font-bold">{t.category}</h4><p className="text-sm text-slate-600">{t.description}</p></div>
                    <StatusBadge status={t.status} />
                  </Card>
               ))}
             </div>
          </div>
        </main>
      </div>
    );
  }

  // Create Ticket, Tenant Home: Mismo código base, ya actualizados para mostrar ubicación
  if (view === 'create-ticket') { /* ... Mismo código anterior ... */ 
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans">
        <div className="max-w-lg mx-auto">
          <Button onClick={() => setView(userRole === 'owner' ? 'owner-home' : 'tenant-home')} variant="secondary" className="mb-6">← Cancelar</Button>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-amber-600">Reportar Novedad</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <select required className="w-full p-3 border rounded-lg bg-white" onChange={(e:any) => setNewTicket({...newTicket, propertyId: e.target.value})}>
                <option value="">Selecciona inmueble...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.address} ({p.municipality})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-3 border rounded-lg bg-white" value={newTicket.category} onChange={(e:any) => setNewTicket({...newTicket, category: e.target.value})}>
                  <option>Plomería</option><option>Electricidad</option><option>Electrodomésticos</option><option>Otros</option>
                </select>
                <select className="w-full p-3 border rounded-lg bg-white" value={newTicket.priority} onChange={(e:any) => setNewTicket({...newTicket, priority: e.target.value})}>
                  <option>Baja</option><option>Media</option><option>Alta</option>
                </select>
              </div>
              <textarea required rows={4} placeholder="Detalles..." className="w-full p-3 border rounded-lg" value={newTicket.description} onChange={(e:any) => setNewTicket({...newTicket, description: e.target.value})} />
              <div className="p-4 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2"><Truck size={16} /> Se buscarán proveedores en la zona.</div>
              <Button disabled={loading} type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white">Crear Ticket</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'tenant-home') { /* ... Mismo código anterior ... */ 
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
         <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="font-bold text-xl text-emerald-600">Mi Hogar</div>
          <button onClick={handleLogout} className="text-slate-400"><LogOut size={20}/></button>
        </nav>
        <main className="p-4 max-w-lg mx-auto space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-1">Bienvenido</h2>
            {properties.length > 0 ? (
               <p className="opacity-90 flex items-center gap-2 mt-2"><MapPin size={16}/> {properties[0].address}, {properties[0].municipality}</p>
            ) : <p className="opacity-90 text-sm mt-2">No se encontró tu propiedad asignada.</p>}
            <div className="mt-8">
              <button onClick={() => setView('create-ticket')} className="bg-white text-emerald-600 px-5 py-3 rounded-xl font-bold text-sm shadow-lg w-full">Reportar Problema</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 mb-4">Mis Reportes</h3>
            <div className="space-y-3">
              {tickets.filter(t => t.reporter === 'Inquilino').map(t => (
                <Card key={t.id} className="p-4 flex justify-between items-center">
                  <div><h4 className="font-bold text-slate-800">{t.category}</h4><p className="text-xs text-slate-500">{t.date}</p></div>
                  <StatusBadge status={t.status} />
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}