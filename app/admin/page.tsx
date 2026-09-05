'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Trash2, ArrowLeft, RefreshCcw, Bell, UserX, UserCheck, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Pestañas organizadas: Vista Barberos como principal, Hoy, Semana, Mes, Canceladas y Añadir Cita
  const [adminTab, setAdminTab] = useState<'barbers' | 'today' | 'week' | 'month' | 'cancelled' | 'create'>('barbers');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<'Cholo' | 'Eduardo' | 'Gordito'>('Cholo');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Estados para el formulario de creación manual de citas por el admin
  const [newClient, setNewClient] = useState('');
  const [newService, setNewService] = useState('Corte General');
  const [newPrice, setNewPrice] = useState('200');
  const [newBarber, setNewBarber] = useState<'Cholo' | 'Eduardo' | 'Gordito'>('Cholo');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newPhone, setNewPhone] = useState('S/N');
  const [newNote, setNewNote] = useState('');

  const [barberStatus, setBarberStatus] = useState<{ [key: string]: boolean }>({
    'Cholo': true,
    'Eduardo': true,
    'Gordito': true,
  });

  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    const savedPushStatus = localStorage.getItem('belics_push_subscribed');
    if (savedPushStatus === 'true') {
      setPushSubscribed(true);
    }
    const savedBarbers = localStorage.getItem('belics_barbers_status');
    if (savedBarbers) {
      try {
        setBarberStatus(JSON.parse(savedBarbers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleBarberStatus = (barberName: string) => {
    const updated = { ...barberStatus, [barberName]: !barberStatus[barberName] };
    setBarberStatus(updated);
    localStorage.setItem('belics_barbers_status', JSON.stringify(updated));
  };

  const subscribeButtonHandler = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCX9iMW4caZMYynEPYwbpWlJC23I37xMESR-cJwunLmSoQcxyF3ULBpInxpRhm7s8ah0HqbvbIpMPXlduwt7r7w';
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        setPushSubscribed(true);
        localStorage.setItem('belics_push_subscribed', 'true');
        alert('¡Dispositivo vinculado con éxito!');
      } else {
        alert('Error al guardar la suscripción.');
      }
    } catch (err) {
      console.error(err);
      alert('Permiso denegado o error al activar.');
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/citas');
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any, index: number) => ({
          id: item.id || index.toString(),
          client: item.clientname || item.clientName || item.client || item.nombre || 'Cliente',
          service: item.service || item.corte || 'Corte General',
          barber: item.barbername || item.barberName || item.barber || item.barbero || 'Cholo',
          time: item.appointmenttime || item.appointmentTime || item.time || item.hora || '10:00 AM',
          phone: item.clientphone || item.clientPhone || item.phone || item.telefono || 'S/N',
          date: item.appointmentdate || item.appointmentDate || item.date || item.fecha || new Date().toISOString().split('T')[0],
          note: item.note || item.nota || 'Sin notas adicionales.',
          status: item.status || 'pendiente',
          price: Number(item.price || item.precio || 200)
        }));
        setAppointments(formatted);
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
      const interval = setInterval(fetchAppointments, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('auth', 'true');
    } else {
      alert('Contraseña incorrecta.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/citas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await fetch(`/api/citas?id=${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  // Crear cita manualmente desde el panel de admin
  const handleCreateAppointmentManually = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newClient,
          service: newService,
          price: Number(newPrice),
          barberName: newBarber,
          appointmentDate: newDate,
          appointmentTime: newTime,
          clientPhone: newPhone,
          note: newNote || 'Creada manualmente por el Administrador',
          status: 'confirmada' // Las hechas por el admin entran directo como confirmadas o pendientes según prefieras
        })
      });

      if (res.ok) {
        alert('¡Cita registrada con éxito!');
        setNewClient('');
        setNewNote('');
        fetchAppointments();
        setAdminTab('barbers'); // Regresar a la vista principal de barberos
      } else {
        alert('Error al registrar la cita.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al registrar la cita.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayConfirmedAppointments = appointments.filter(a => a.date === todayStr && a.status === 'confirmada');
  const totalRevenueToday = todayConfirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);

  // Funciones de cálculo para semana y mes
  const isCurrentWeek = (dateStr: string) => {
    const currDate = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return currDate >= startOfWeek && currDate <= endOfWeek;
  };

  const isCurrentMonth = (dateStr: string) => {
    const currDate = new Date(dateStr);
    const now = new Date();
    return currDate.getMonth() === now.getMonth() && currDate.getFullYear() === now.getFullYear();
  };

  return (
    <div className="min-h-screen bg-[#040405] text-neutral-100 font-sans p-6 sm:p-10 relative">
      
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <button 
          onClick={() => { window.location.href = '/'; }} 
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver a Belics Barbershop
        </button>
        <span className="text-sm font-black tracking-wider uppercase text-amber-400">Belics Push Cloud</span>
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl mt-16 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/30">
              <Lock className="text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Acceso Gerencial Seguro</h3>
              <p className="text-xs text-neutral-400">Introduce la contraseña de administración</p>
            </div>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Contraseña"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-center tracking-[0.3em] text-xl font-black focus:outline-none focus:border-amber-400 transition-colors"
              required
              autoFocus
            />
            <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-black py-4 rounded-xl hover:bg-amber-300 transition-all shadow-lg tracking-wide text-sm mt-2">
              Validar y Entrar al Sistema
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900/60 border border-neutral-800 p-8 rounded-3xl gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/30">
                <ShieldCheck className="text-green-400" size={30} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Panel Gerencial Belics</h1>
                <p className="text-xs text-green-400 font-medium">● Control de personal y registros</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={subscribeButtonHandler} 
                className="bg-amber-400 text-neutral-950 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-amber-300 transition-colors shadow-lg"
              >
                <Bell size={16} /> {pushSubscribed ? 'Notificaciones ✓' : 'Activar Alertas'}
              </button>
              <button 
                onClick={fetchAppointments} 
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-neutral-700 transition-colors"
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
              </button>
              <button onClick={handleLogout} className="text-xs text-neutral-400 hover:text-red-400 border border-neutral-800 bg-neutral-950 px-5 py-3 rounded-xl font-bold transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* CONTROL DE DISPONIBILIDAD DE BARBEROS */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl space-y-4">
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">⚡ Estado del Personal (Descanso / Inactivo)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { name: 'Cholo', role: 'Master Barber' },
                { name: 'Eduardo', role: 'Senior Barber' },
                { name: 'Gordito', role: 'Barber' },
              ].map((barber) => {
                const isActive = barberStatus[barber.name] ?? true;
                return (
                  <div key={barber.name} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isActive ? 'bg-neutral-950 border-neutral-800' : 'bg-red-950/20 border-red-900/50 opacity-75'}`}>
                    <div>
                      <p className="font-bold text-white text-sm">{barber.name}</p>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isActive ? 'Disponible' : 'En Descanso'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleBarberStatus(barber.name)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' : 'bg-green-500 text-neutral-950 hover:bg-green-400 shadow-lg'}`}
                    >
                      {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      {isActive ? 'Descanso' : 'Activar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TARJETAS DE MÉTRICAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <Users className="text-amber-400" size={28} />
              <div>
                <p className="text-xs text-neutral-400 font-medium">Total Solicitudes</p>
                <p className="text-2xl font-black">{appointments.length}</p>
              </div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <DollarSign className="text-green-400" size={28} />
              <div>
                <p className="text-xs text-neutral-400 font-medium">Ingresos Reales Hoy</p>
                <p className="text-2xl font-black text-green-400">${totalRevenueToday} MXN</p>
              </div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <TrendingUp className="text-blue-400" size={28} />
              <div>
                <p className="text-xs text-neutral-400 font-medium">Confirmadas Hoy</p>
                <p className="text-2xl font-black">{todayConfirmedAppointments.length}</p>
              </div>
            </div>
          </div>

          {/* BARRA DE NAVEGACIÓN DE PESTAÑAS ORGANIZADA */}
          <div className="flex flex-wrap gap-2 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setAdminTab('barbers')}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === 'barbers' ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                ✂️ Vista Barberos
              </button>
              <button 
                onClick={() => setAdminTab('today')}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === 'today' ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                📅 Hoy (Confirmadas)
              </button>
              <button 
                onClick={() => setAdminTab('week')}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === 'week' ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                📆 Semana
              </button>
              <button 
                onClick={() => setAdminTab('month')}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === 'month' ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                📊 Mes
              </button>
              <button 
                onClick={() => setAdminTab('cancelled')}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === 'cancelled' ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                ❌ Canceladas ({appointments.filter(a => a.status === 'cancelada').length})
              </button>
            </div>

            <button 
              onClick={() => setAdminTab('create')}
              className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all bg-green-500 text-neutral-950 hover:bg-green-400 shadow-lg`}
            >
              <PlusCircle size={16} /> Registrar Cita Manual
            </button>
          </div>

          {/* CONTENEDOR PRINCIPAL SEGÚN LA PESTAÑA */}
          <div className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-3xl space-y-6">
            
            {/* 1. VISTA DE BARBEROS (CADA UNO CON SU SECCIÓN DE PENDIENTES) */}
            {adminTab === 'barbers' && (
              <div className="space-y-6">
                <div className="flex gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 items-center justify-between flex-wrap">
                  <span className="text-xs font-bold text-neutral-300 uppercase">Seleccionar Estación:</span>
                  <div className="flex gap-2">
                    {(['Cholo', 'Eduardo', 'Gordito'] as const).map((b) => (
                      <button 
                        key={b}
                        onClick={() => setSelectedBarberFilter(b)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${selectedBarberFilter === b ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                    📥 Solicitudes Pendientes para {selectedBarberFilter}
                  </h3>

                  {appointments.filter(a => a.barber === selectedBarberFilter && a.status === 'pendiente').length === 0 ? (
                    <div className="text-center py-12 bg-neutral-950 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                      No hay citas pendientes para {selectedBarberFilter}.
                    </div>
                  ) : (
                    appointments
                      .filter(a => a.barber === selectedBarberFilter && a.status === 'pendiente')
                      .map(appt => (
                        <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <p className="font-bold text-white text-base">
                              {appt.client} - <span className="text-amber-400">{appt.service} (${appt.price} MXN)</span>
                            </p>
                            <p className="text-xs text-neutral-400">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                            {appt.note && <p className="text-xs text-amber-200/80 bg-neutral-900 p-2 rounded-lg mt-1">Nota: {appt.note}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => updateStatus(appt.id, 'confirmada')} className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-neutral-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={14} /> Confirmar
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'cancelada')} className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                              <XCircle size={14} /> Cancelar
                            </button>
                            <button onClick={() => deleteAppointment(appt.id)} className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 p-2.5 rounded-xl">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* 2. VISTA HOY (SOLO CONFIRMADAS) */}
            {adminTab === 'today' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-green-400 uppercase tracking-wider">📅 Citas Confirmadas para Hoy ({todayStr})</h3>
                {todayConfirmedAppointments.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm">No hay citas confirmadas para hoy.</div>
                ) : (
                  todayConfirmedAppointments.map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">✂️ Barbero: {appt.barber} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                      </div>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-bold">
                        CONFIRMADA
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. VISTA SEMANA */}
            {adminTab === 'week' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider">📆 Citas de la Semana Actual</h3>
                {appointments.filter(a => isCurrentWeek(a.date)).length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm">No hay citas registradas esta semana.</div>
                ) : (
                  appointments.filter(a => isCurrentWeek(a.date)).map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">📅 Fecha: {appt.date} · ⏰ {appt.time} · ✂️ {appt.barber}</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {appt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. VISTA MES */}
            {adminTab === 'month' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-purple-400 uppercase tracking-wider">📊 Citas del Mes Actual</h3>
                {appointments.filter(a => isCurrentMonth(a.date)).length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm">No hay citas registradas este mes.</div>
                ) : (
                  appointments.filter(a => isCurrentMonth(a.date)).map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">📅 Fecha: {appt.date} · ⏰ {appt.time} · ✂️ {appt.barber}</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {appt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. VISTA CANCELADAS */}
            {adminTab === 'cancelled' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">❌ Registro de Citas Canceladas</h3>
                {appointments.filter(a => a.status === 'cancelada').length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm">No hay citas canceladas.</div>
                ) : (
                  appointments.filter(a => a.status === 'cancelada').map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · ✂️ Barbero: {appt.barber}</p>
                      </div>
                      <button onClick={() => deleteAppointment(appt.id)} className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 p-3 rounded-xl">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 6. FORMULARIO PARA CREAR CITA MANUALMENTE */}
            {adminTab === 'create' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white">Registrar Cita Manualmente</h3>
                  <p className="text-xs text-neutral-400">Crea una cita directamente asignándola al barbero de tu preferencia.</p>
                </div>

                <form onSubmit={handleCreateAppointmentManually} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Nombre del Cliente</label>
                      <input 
                        type="text" 
                        value={newClient} 
                        onChange={(e) => setNewClient(e.target.value)} 
                        placeholder="Ej. Juan Pérez" 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Teléfono</label>
                      <input 
                        type="text" 
                        value={newPhone} 
                        onChange={(e) => setNewPhone(e.target.value)} 
                        placeholder="Ej. 6670000000" 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Servicio / Corte</label>
                      <input 
                        type="text" 
                        value={newService} 
                        onChange={(e) => setNewService(e.target.value)} 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Precio ($ MXN)</label>
                      <input 
                        type="number" 
                        value={newPrice} 
                        onChange={(e) => setNewPrice(e.target.value)} 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Barbero Asignado</label>
                      <select 
                        value={newBarber} 
                        onChange={(e) => setNewBarber(e.target.value as any)} 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="Cholo">Cholo</option>
                        <option value="Eduardo">Eduardo</option>
                        <option value="Gordito">Gordito</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Fecha</label>
                      <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)} 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Hora</label>
                      <input 
                        type="text" 
                        value={newTime} 
                        onChange={(e) => setNewTime(e.target.value)} 
                        placeholder="Ej. 11:00 AM" 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Notas Adicionales</label>
                    <textarea 
                      value={newNote} 
                      onChange={(e) => setNewNote(e.target.value)} 
                      placeholder="Detalles de la cita..." 
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 h-20"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-amber-400 text-neutral-950 font-black py-3.5 rounded-xl hover:bg-amber-300 transition-all shadow-lg text-sm">
                      Guardar y Registrar Cita
                    </button>
                    <button type="button" onClick={() => setAdminTab('barbers')} className="bg-neutral-800 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-neutral-700 transition-all text-xs">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}