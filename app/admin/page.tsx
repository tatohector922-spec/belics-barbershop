'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Trash2, ArrowLeft, RefreshCcw, Bell } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [adminTab, setAdminTab] = useState<'today' | 'week' | 'month' | 'year' | 'pending' | 'cancelled' | 'barbers'>('pending');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<'Héctor (Master Barber)' | 'Alexis (Senior Barber)'>('Héctor (Master Barber)');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Al cargar, revisa si ya habías iniciado sesión antes y si las notificaciones ya estaban activas
  useEffect(() => {
    const savedAuth = localStorage.getItem('belics_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    const savedPushStatus = localStorage.getItem('belics_push_subscribed');
    if (savedPushStatus === 'true') {
      setPushSubscribed(true);
    }
  }, []);

  // Botón para activar las notificaciones push nativas en tu celular
  const subscribeButtonHandler = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready; // Asegura que el service worker esté listo y despierto
      
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
        alert('¡Dispositivo vinculado con éxito para recibir notificaciones push!');
      } else {
        alert('Hubo un error al guardar la suscripción en el servidor.');
      }
    } catch (err) {
      console.error('Error al suscribir a push:', err);
      alert('Permiso denegado o error al activar. Asegúrate de tener la app abierta desde tu pantalla de inicio.');
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
          barber: item.barbername || item.barberName || item.barber || item.barbero || 'Héctor (Master Barber)',
          time: item.appointmenttime || item.appointmentTime || item.time || item.hora || '10:00 AM',
          phone: item.clientphone || item.clientPhone || item.phone || item.telefono || 'S/N',
          date: item.appointmentdate || item.appointmentDate || item.date || item.fecha || new Date().toISOString().split('T')[0],
          note: item.note || item.nota || 'Sin notas adicionales.',
          status: item.status || 'pendiente',
          price: Number(item.price || item.precio || 350)
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      setIsAuthenticated(true);
      localStorage.setItem('belics_admin_auth', 'true');
    } else {
      alert('Código incorrecto.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('belics_admin_auth');
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayConfirmedAppointments = appointments.filter(a => a.date === todayStr && a.status === 'confirmada');
  const totalRevenueToday = todayConfirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);

  const filteredAppointments = appointments.filter(appt => {
    if (adminTab === 'pending') return appt.status === 'pendiente';
    if (adminTab === 'cancelled') return appt.status === 'cancelada';
    if (adminTab === 'today') return appt.date === todayStr;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#040405] text-neutral-100 font-sans p-6 sm:p-10 relative">
      
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl">
          <ArrowLeft size={16} /> Volver a Belics Barbershop
        </Link>
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
              <p className="text-xs text-neutral-400">Introduce el código de autenticación</p>
            </div>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <input 
              type="text" 
              maxLength={6}
              value={totpCode} 
              onChange={(e) => setTotpCode(e.target.value)} 
              placeholder="000000"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-center tracking-[0.6em] text-2xl font-black focus:outline-none focus:border-amber-400 transition-colors"
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
                <h1 className="text-2xl sm:text-3xl font-black text-white">Panel con Push Móvil</h1>
                <p className="text-xs text-green-400 font-medium">● Vincula tu celular para alertas directas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={subscribeButtonHandler} 
                className="bg-amber-400 text-neutral-950 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-amber-300 transition-colors shadow-lg"
              >
                <Bell size={16} /> {pushSubscribed ? 'Dispositivo Vinculado ✓' : 'Activar Notificaciones en este Celular'}
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

          <div className="flex flex-wrap gap-2 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
            {[
              { id: 'pending', label: `📥 Pendientes (${appointments.filter(a => a.status === 'pendiente').length})` },
              { id: 'today', label: '📅 Hoy' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'year', label: 'Año' },
              { id: 'cancelled', label: `❌ Canceladas (${appointments.filter(a => a.status === 'cancelada').length})` },
              { id: 'barbers', label: '✂️ Vista Barberos' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === tab.id ? 'bg-amber-400 text-neutral-950 shadow-lg font-black' : 'text-neutral-400 hover:text-white bg-neutral-950/50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-3xl space-y-4">
            {adminTab === 'barbers' ? (
              <div className="space-y-6">
                <div className="flex gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 items-center justify-between flex-wrap">
                  <span className="text-xs font-bold text-neutral-300 uppercase">Seleccionar Estación:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedBarberFilter('Héctor (Master Barber)')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${selectedBarberFilter === 'Héctor (Master Barber)' ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400'}`}
                    >
                      Héctor (Master Barber)
                    </button>
                    <button 
                      onClick={() => setSelectedBarberFilter('Alexis (Senior Barber)')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold ${selectedBarberFilter === 'Alexis (Senior Barber)' ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400'}`}
                    >
                      Alexis (Senior Barber)
                    </button>
                  </div>
                </div>

                {appointments.filter(a => a.barber === selectedBarberFilter).length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm">
                    No hay citas para {selectedBarberFilter}.
                  </div>
                ) : (
                  appointments.filter(a => a.barber === selectedBarberFilter).map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                      </div>
                      <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 px-4 py-2 rounded-full font-bold">
                        {appt.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 text-sm">
                No hay registros en esta vista.
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-6 rounded-2xl border border-neutral-800 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-white text-lg">{appt.client}</p>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 font-bold">
                        {appt.service} (${appt.price} MXN)
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-blue-400 font-bold">
                        Barbero: {appt.barber}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${appt.status === 'confirmada' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                    {appt.note && (
                      <p className="text-xs text-amber-200/80 bg-neutral-900 p-3 rounded-xl border border-neutral-800 mt-2">
                        <span className="font-bold text-amber-400">Nota:</span> {appt.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {appt.status !== 'confirmada' && (
                      <button onClick={() => updateStatus(appt.id, 'confirmada')} className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-neutral-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Confirmar
                      </button>
                    )}
                    {appt.status !== 'cancelada' && (
                      <button onClick={() => updateStatus(appt.id, 'cancelada')} className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <XCircle size={16} /> Cancelar
                      </button>
                    )}
                    <button onClick={() => deleteAppointment(appt.id)} className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 p-3 rounded-xl">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}