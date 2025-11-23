'use client';

import React, { useState, useEffect } from 'react';
// 👇 Importamos la conexión real a Supabase
import { supabase } from '@/lib/supabaseClient'; 

import { 
  Home, User, Wrench, MapPin, Plus, CheckCircle, 
  AlertTriangle, Truck, UserCheck, LogOut, 
  MessageCircle, Calendar, Mail, Lock, Phone, Send
} from 'lucide-react';

const KEYHOME_WHATSAPP = "573001234567"; 

// --- COMPONENTES VISUALES ---
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

  // Auth & Forms
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newProp, setNewProp] = useState({ address: '', city: '', type: 'Apartamento', isRented: false, tenantName: '', tenantEmail: '', contractStart: '', contractEnd: '' });
  const [newTicket, setNewTicket] = useState({ propertyId: '', category: 'Plomería', description: '', priority: 'Media', providerOption: 'KeyhomeKey' });

  // Efecto de inicio de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) login('owner'); 
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setView('login');
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- CARGA DE DATOS INTELIGENTE ---
  const fetchData = async (roleOverride?: string) => {
    setLoading(true);
    const role = roleOverride || userRole;
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;

    let propsQuery = supabase.from('properties').select('*').order('created_at', { ascending: false });
    let ticketsQuery = supabase.from('tickets').select('*').order('created_at', { ascending: false });

    // FILTROS SEGÚN ROL
    if (role === 'owner' && userId) {
      propsQuery = propsQuery.eq('owner_id', userId); 
    } else if (role === 'tenant' && userEmail) {
      propsQuery = propsQuery.eq('tenant_email', userEmail);
    }

    const { data: propsData } = await propsQuery;
    if (propsData) setProperties(propsData);

    const { data: ticketsData } = await ticketsQuery;
    if (ticketsData) setTickets(ticketsData);
    
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Registro exitoso. ¡Inicia sesión!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else login('owner'); 
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('login');
    setUserRole(null);
    setProperties([]);
    setTickets([]);
  };

  const login = (role: string) => {
    setUserRole(role);
    setView(role === 'owner' ? 'owner-home' : role === 'tenant' ? 'tenant-home' : 'provider-home');
    setTimeout(() => fetchData(role), 100);
  };

  const addProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. GUARDAR EN BASE DE DATOS
    const { error } = await supabase.from('properties').insert([
      {
        owner_id: session?.user?.id, 
        address: newProp.address,
        city: newProp.city,
        type: newProp.type,
        is_rented: newProp.isRented,
        tenant_name: newProp.isRented ? newProp.tenantName : null,
        tenant_email: newProp.isRented ? newProp.tenantEmail : null,
        contract_start: newProp.isRented ? newProp.contractStart : null,
        contract_end: newProp.isRented ? newProp.contractEnd : null
      }
    ]);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      // 2. ENVIAR CORREO AUTOMÁTICO (USANDO LA API INTERNA)
      if (newProp.isRented && newProp.tenantEmail) {
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: newProp.tenantEmail,
              name: newProp.tenantName,
              type: 'invitation'
            })
          });
          
          const result = await response.json();

          if (response.ok && result.success) {
            alert("✅ Propiedad guardada y correo de invitación enviado automáticamente 📨");
          } else {
            console.error("Error envío correo:", result);
            alert(`⚠️ Propiedad guardada, pero hubo un problema enviando el correo: ${result.error?.message || 'Error desconocido'}`);
          }
        } catch (err) {
          console.error(err);
          alert("⚠️ Propiedad guardada, pero falló el servicio de correo.");
        }
      } else {
        alert("✅ Propiedad guardada exitosamente.");
      }

      setNewProp({ address: '', city: '', type: 'Apartamento', isRented: false, tenantName: '', tenantEmail: '', contractStart: '', contractEnd: '' });
      setView('owner-home');
      fetchData('owner'); 
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
      const prop = properties.find(p => p.id == newTicket.propertyId);
      const address = prop ? prop.address : "";
      const text = `Hola, nuevo reporte:\n📍 ${address}\n🔧 ${newTicket.category}\n📝 ${newTicket.description}`;
      window.open(`https://wa.me/${KEYHOME_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
      alert("Ticket creado.");
      setView(userRole === 'owner' ? 'owner-home' : 'tenant-home');
      fetchData(userRole!); 
    }
    setLoading(false);
  };

  const advanceTicketStatus = async (ticketId: number, currentStatus: string) => {
    const flow = ['Pendiente', 'Asignado', 'En Camino', 'En Sitio', 'Resuelto'];
    const idx = flow.indexOf(currentStatus);
    if (idx < flow.length - 1) {
      await supabase.from('tickets').update({ status: flow[idx + 1] }).eq('id', ticketId);
      fetchData();
    }
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
            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3">
              <Button onClick={() => login('tenant')} variant="secondary" className="text-xs">Soy Inquilino</Button>
              <Button onClick={() => login('provider')} variant="secondary" className="text-xs">Soy Proveedor</Button>
            </div>
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
              <Input icon={MapPin} required placeholder="Dirección" value={newProp.address} onChange={(e:any) => setNewProp({...newProp, address: e.target.value})} />
              <Input icon={MapPin} required placeholder="Ciudad" value={newProp.city} onChange={(e:any) => setNewProp({...newProp, city: e.target.value})} />
              <select className="w-full p-3 border rounded-xl bg-slate-50" value={newProp.type} onChange={(e:any) => setNewProp({...newProp, type: e.target.value})}>
                <option>Apartamento</option><option>Casa</option><option>Local</option>
              </select>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <label className="flex items-center gap-3 font-bold text-indigo-900 cursor-pointer mb-3">
                  <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={newProp.isRented} onChange={(e:any) => setNewProp({...newProp, isRented: e.target.checked})} /> En Arriendo
                </label>
                {newProp.isRented && (
                  <div className="space-y-3 pl-2 border-l-2 border-indigo-200">
                    <Input icon={User} required placeholder="Nombre Inquilino" value={newProp.tenantName} onChange={(e:any) => setNewProp({...newProp, tenantName: e.target.value})} />
                    <Input icon={Mail} required type="email" placeholder="Email Inquilino" value={newProp.tenantEmail} onChange={(e:any) => setNewProp({...newProp, tenantEmail: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="p-2 rounded border" required value={newProp.contractStart} onChange={(e:any) => setNewProp({...newProp, contractStart: e.target.value})} />
                      <input type="date" className="p-2 rounded border" required value={newProp.contractEnd} onChange={(e:any) => setNewProp({...newProp, contractEnd: e.target.value})} />
                    </div>
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex items-center gap-2"><Send size={14}/> El sistema enviará la invitación automáticamente.</div>
                  </div>
                )}
              </div>
              <Button disabled={loading} type="submit" className="w-full">Guardar</Button>
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
          {properties.length === 0 && !loading && <p className="text-center text-slate-400 py-10">No tienes propiedades registradas.</p>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(p => (
              <Card key={p.id} className="relative p-5">
                <div className={`absolute top-0 left-0 h-full w-1 ${p.is_rented ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <h3 className="font-bold text-lg">{p.address}</h3>
                <p className="text-slate-500 text-sm mb-2">{p.city}</p>
                {p.is_rented ? (
                  <div className="bg-emerald-50 p-2 rounded text-xs text-emerald-800 border border-emerald-100">
                    <p className="font-bold">{p.tenant_name}</p>
                    <p className="opacity-75">{p.tenant_email}</p>
                  </div>
                ) : <div className="bg-slate-50 p-2 rounded text-center text-xs text-slate-400">Vacante</div>}
              </Card>
            ))}
          </div>
          <div className="pt-6 border-t">
             <div className="flex justify-between items-end mb-4">
               <h2 className="text-xl font-bold text-slate-800">Novedades</h2>
               <Button onClick={() => setView('create-ticket')} className="bg-amber-100 text-amber-700 text-sm">Reportar</Button>
             </div>
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

  if (view === 'create-ticket') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans">
        <div className="max-w-lg mx-auto">
          <Button onClick={() => setView(userRole === 'owner' ? 'owner-home' : 'tenant-home')} variant="secondary" className="mb-6">← Cancelar</Button>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-amber-600">Reportar Novedad</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <select required className="w-full p-3 border rounded-lg bg-white" onChange={(e:any) => setNewTicket({...newTicket, propertyId: e.target.value})}>
                <option value="">Selecciona inmueble...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-3 border rounded-lg bg-white" value={newTicket.category} onChange={(e:any) => setNewTicket({...newTicket, category: e.target.value})}>
                  <option>Plomería</option><option>Electricidad</option><option>Humedad</option><option>Otros</option>
                </select>
                <select className="w-full p-3 border rounded-lg bg-white" value={newTicket.priority} onChange={(e:any) => setNewTicket({...newTicket, priority: e.target.value})}>
                  <option>Baja</option><option>Media</option><option>Alta</option>
                </select>
              </div>
              <textarea required rows={4} placeholder="Detalles..." className="w-full p-3 border rounded-lg" value={newTicket.description} onChange={(e:any) => setNewTicket({...newTicket, description: e.target.value})} />
              <Button disabled={loading} type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white">Crear Ticket</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole === 'tenant') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
         <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="font-bold text-xl text-indigo-600">Mi Hogar</div>
          <button onClick={handleLogout} className="text-slate-400"><LogOut size={20}/></button>
        </nav>
        <main className="p-4 max-w-lg mx-auto space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
            <h2 className="text-2xl font-bold mb-1">Bienvenido</h2>
            {properties.length > 0 ? (
               <p className="opacity-90 flex items-center gap-2 mt-2"><MapPin size={16}/> {properties[0].address}</p>
            ) : <p className="opacity-90 text-sm mt-2">No tienes propiedades asignadas.</p>}
            <div className="mt-8">
              <button onClick={() => setView('create-ticket')} className="bg-white text-indigo-600 px-5 py-3 rounded-xl font-bold text-sm shadow-lg w-full">Reportar Problema</button>
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

  if (userRole === 'provider') {
    return (
      <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
        <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">
          <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shadow-lg z-10">
            <h2 className="font-bold flex items-center gap-2 text-lg"><Wrench/> Panel Técnico</h2>
            <button onClick={handleLogout}><LogOut size={20}/></button>
          </div>
          <div className="p-4 flex-1 space-y-4 bg-slate-50 overflow-y-auto">
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-3">
              <div className="bg-white p-1.5 rounded-full shadow-sm"><Phone size={16} className="text-emerald-600"/></div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Modo Móvil</p>
                <p className="text-xs text-emerald-700">Vista optimizada para técnicos en terreno.</p>
              </div>
            </div>
            {loading ? <p className="text-center p-4 text-slate-400">Buscando servicios...</p> : tickets.filter(t => t.status !== 'Resuelto').map(t => (
              <Card key={t.id} className="border-l-4 border-l-emerald-500 shadow-md">
                <div className="p-5">
                  <div className="flex justify-between mb-3">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold">#{t.id}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${t.priority === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{t.priority}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{t.category}</h3>
                  <p className="text-slate-600 text-sm mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{t.description}"</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
                    <MapPin size={18} className="text-emerald-600 shrink-0"/>
                    <span className="font-medium">{properties.find(p => p.id === t.property_id)?.address || 'Dirección cargando...'}</span>
                  </div>
                  <div className="grid gap-2">
                     {t.status === 'Pendiente' && <Button onClick={() => advanceTicketStatus(t.id, t.status)} variant="primary" className="w-full">Aceptar Trabajo</Button>}
                     {t.status === 'Asignado' && <Button onClick={() => advanceTicketStatus(t.id, t.status)} variant="purple" className="w-full"><Truck size={18}/> Iniciar Ruta</Button>}
                     {t.status === 'En Camino' && <Button onClick={() => advanceTicketStatus(t.id, t.status)} className="bg-indigo-600 hover:bg-indigo-700 w-full"><MapPin size={18}/> Llegué al Sitio</Button>}
                     {t.status === 'En Sitio' && <Button onClick={() => advanceTicketStatus(t.id, t.status)} variant="success" className="w-full"><CheckCircle size={18}/> Finalizar Trabajo</Button>}
                  </div>
                </div>
              </Card>
            ))}
            {tickets.filter(t => t.status !== 'Resuelto').length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-4 text-slate-200"/>
                <p>¡Todo limpio! No tienes servicios pendientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}