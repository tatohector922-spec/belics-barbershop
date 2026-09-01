'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Trash2, ArrowLeft, RefreshCcw, Bell, UserX, UserCheck, Calendar, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [adminTab, setAdminTab] = useState<'today' | 'week' | 'month' | 'year' | 'pending' | 'cancelled' | 'barbers'>('pending');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('Cholo');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newService, setNewService] = useState('Corte (160 pesos)');
  const [newBarber, setNewBarber] = useState('Cholo');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newNote, setNewNote] = useState('Creada manualmente por el admin');

  const [barberUnavailable, setBarberUnavailable] = useState<{ [key: string]: boolean }>({});

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const barbersList = ['Cholo', 'Eduardo', 'Gustavo'];

  useEffect(() => {
    if (localStorage.getItem('auth') === 'true') setIsAuthenticated(true);
    if (localStorage.getItem('belics_push_subscribed') === 'true') setPushSubscribed(true);
    fetchAusencias();
  }, []);

  const fetchAusencias = async () => {
    try {
      const res = await fetch('/api/ausencias');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setBarberUnavailable(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleUnavailableDay = async (barberName: string, dateStr: string) => {
    const key = `${barberName}_${dateStr}`;
    const updated = { ...barberUnavailable, [key]: !barberUnavailable[key] };
    setBarberUnavailable(updated);

    try {
      await fetch('/api/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Error guardando ausencia en servidor:', e);
    }
  };

  const subscribeButtonHandler = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCX9iMW4caZMYynEPYwbpWlJC23I37xMESR-cJwunLmSoQcxyF3ULBpInxpRhm7s8ah0HqbvbIpMPXlduwt7r7w';
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      setPushSubscribed(true);
      localStorage.setItem('belics_push_subscribed', 'true');
      alert('¡Dispositivo vinculado con éxito!');
    } catch (err) {
      console.error(err);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
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
          service: item.service || item.corte || 'Corte',
          barber: item.barbername || item.barberName || item.barber || item.barbero || 'Cholo',
          time: item.appointmenttime || item.appointmentTime || item.time || item.hora || '11:00 AM',
          phone: item.clientphone || item.clientPhone || item.phone || item.telefono || 'S/N',
          date: item.appointmentdate || item.appointmentDate || item.date || item.fecha || new Date().toISOString().split('T')[0],
          note: item.note || item.nota || 'Sin notas adicionales.',
          status: item.status || 'pendiente',
          price: Number(item.price || item.precio || 160)
        }));
        setAppointments(formatted);
      }
    } catch (err) {
      console.error(err);
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

  const handleVerifyAuthCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: authCodeInput }) });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('auth', 'true');
      } else {
        alert('Código incorrecto.');
        setAuthCodeInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch('/api/citas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) });
    fetchAppointments();
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await fetch(`/api/citas?id=${id}`, { method: 'DELETE' });
    fetchAppointments();
  };

  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    let numericPrice = 160;
    if (newService.includes('120')) numericPrice = 120;
    if (newService.includes('260')) numericPrice = 260;
    if (newService.includes('280')) numericPrice = 280;
    if (newService.includes('30')) numericPrice = 30;

    const res = await fetch('/api/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: newClientName,
        clientPhone: newClientPhone,
        service: newService,
        barberName: newBarber,
        appointmentDate: newDate,
        appointmentTime: newTime,
        note: newNote,
        price: numericPrice,
        status: 'confirmada'
      })
    });
    if ((await res.json()).success) {
      alert('¡Cita agregada!');
      setShowAddModal(false);
      fetchAppointments();
    }
  };

  const todayConfirmedAppointments = appointments.filter(a => a.date === todayStr && a.status === 'confirmada');
  const totalRevenueToday = todayConfirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);
  const filteredAppointments = appointments.filter(appt => {
    if (adminTab === 'pending') return appt.status === 'pendiente';
    if (adminTab === 'cancelled') return appt.status === 'cancelada';
    if (adminTab === 'today') return appt.date === todayStr;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#040405] text-neutral-100 font-sans p-6 sm:p-10">
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-amber-400 bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl">
          <ArrowLeft size={16} /> Volver a la Barbería
        </Link>
        <span className="text-sm font-black text-amber-400 uppercase">Panel Administrativo</span>
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl mt-16">
          <h3 className="text-xl font-bold mb-2">Autenticación de 2 Pasos</h3>
          <p className="text-xs text-neutral-400 mb-6">Introduce el código de Google Authenticator</p>
          <form onSubmit={handleVerifyAuthCode} className="space-y-4">
            <input type="text" maxLength={6} value={authCodeInput} onChange={(e) => setAuthCodeInput(e.target.value)} placeholder="000000" className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-center tracking-[0.4em] text-2xl font-black focus:outline-none focus:border-amber-400" required autoFocus />
            <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-black py-4 rounded-xl hover:bg-amber-300 text-sm">Verificar Código</button>
          </form>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* HEADER ORGANIZADO */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-neutral-900/60 border border-neutral-800 p-6 sm:p-8 rounded-3xl gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/30">
                <ShieldCheck className="text-green-400" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Panel de Control Ejecutivo</h1>
                <p className="text-xs text-neutral-400">Sistema centralizado de turnos y sincronización cloud</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setShowAddModal(true)} className="bg-green-500 hover:bg-green-400 text-neutral-950 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-colors">
                <PlusCircle size={16} /> Nueva Cita Manual
              </button>
              <button onClick={subscribeButtonHandler} className="bg-amber-400 text-neutral-950 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-amber-300">
                <Bell size={16} /> {pushSubscribed ? 'Push Activas ✓' : 'Activar Push'}
              </button>
              <button onClick={fetchAppointments} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-neutral-700">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Refrescar
              </button>
              <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('auth'); }} className="text-xs text-neutral-400 hover:text-red-400 border border-neutral-800 bg-neutral-950 px-4 py-3 rounded-xl font-bold">
                Salir
              </button>
            </div>
          </div>

          {/* MÉTRICAS CLAVE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <Users className="text-amber-400" size={28} />
              <div><p className="text-xs text-neutral-400">Total Solicitudes</p><p className="text-2xl font-black">{appointments.length}</p></div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <DollarSign className="text-green-400" size={28} />
              <div><p className="text-xs text-neutral-400">Ingresos Hoy</p><p className="text-2xl font-black text-green-400">${totalRevenueToday} MXN</p></div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <TrendingUp className="text-blue-400" size={28} />
              <div><p className="text-xs text-neutral-400">Confirmadas Hoy</p><p className="text-2xl font-black">{todayConfirmedAppointments.length}</p></div>
            </div>
          </div>

          {/* CONTROL DE AUSENCIAS CLOUD */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl space-y-4">
            <h2 className="text-sm font-black text-amber-400 uppercase flex items-center gap-2"><Calendar size={18} /> Gestión de Disponibilidad Global (Ausencias)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {barbersList.map((barberName) => {
                const isOffToday = !!barberUnavailable[`${barberName}_${todayStr}`];
                const isOffTomorrow = !!barberUnavailable[`${barberName}_${tomorrowStr}`];
                return (
                  <div key={barberName} className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center"><h3 className="font-bold text-white text-base">{barberName}</h3></div>
                    <div className="space-y-2">
                      <button onClick={() => toggleUnavailableDay(barberName, todayStr)} className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex justify-between ${isOffToday ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'bg-neutral-900 text-neutral-300'}`}>
                        <span>Ausente Hoy</span> {isOffToday ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button onClick={() => toggleUnavailableDay(barberName, tomorrowStr)} className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex justify-between ${isOffTomorrow ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'bg-neutral-900 text-neutral-300'}`}>
                        <span>Ausente Mañana</span> {isOffTomorrow ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN DE CITAS */}
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
              <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${adminTab === tab.id ? 'bg-amber-400 text-neutral-950 font-black' : 'text-neutral-400 bg-neutral-950/50'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* LISTADO DE CITAS */}
          <div className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-3xl space-y-4">
            {adminTab === 'barbers' ? (
              <div className="space-y-6">
                <div className="flex gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 items-center justify-between flex-wrap">
                  <span className="text-xs font-bold text-neutral-300 uppercase">Estación:</span>
                  <div className="flex gap-2">
                    {barbersList.map((b) => (
                      <button key={b} onClick={() => setSelectedBarberFilter(b)} className={`px-4 py-2 rounded-xl text-xs font-bold ${selectedBarberFilter === b ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400'}`}>{b}</button>
                    ))}
                  </div>
                </div>
                {appointments.filter(a => a.barber === selectedBarberFilter).map(appt => (
                  <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                      <p className="text-xs text-neutral-400 mt-1">📅 {appt.date} · ⏰ {appt.time} · 📞 {appt.phone}</p>
                    </div>
                    <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 px-4 py-2 rounded-full font-bold">{appt.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 text-sm">No hay registros en esta vista.</div>
            ) : (
              filteredAppointments.map((appt) => (
                <div key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-6 rounded-2xl border border-neutral-800 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-white text-lg">{appt.client}</p>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 text-amber-400 font-bold">{appt.service} (${appt.price} MXN)</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 text-blue-400 font-bold">Barbero: {appt.barber}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${appt.status === 'confirmada' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{appt.status}</span>
                    </div>
                    <p className="text-xs text-neutral-400">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {appt.status !== 'confirmada' && <button onClick={() => updateStatus(appt.id, 'confirmada')} className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2.5 rounded-xl text-xs font-bold">Confirmar</button>}
                    {appt.status !== 'cancelada' && <button onClick={() => updateStatus(appt.id, 'cancelada')} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>}
                    <button onClick={() => deleteAppointment(appt.id)} className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 p-3 rounded-xl"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* MODAL CITA MANUAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-amber-400">Crear Cita Manualmente</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 bg-neutral-800 p-2 rounded-xl">✕</button>
                </div>
                <form onSubmit={handleCreateManualAppointment} className="space-y-4">
                  <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Cliente</label><input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm" required /></div>
                  <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Teléfono</label><input type="text" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Servicio</label><select value={newService} onChange={e => setNewService(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm"><option value="Corte (160 pesos)">Corte — 160</option><option value="Corte de niño (120 pesos)">Corte de niño — 120</option><option value="Corte y barba (260 pesos)">Corte y barba — 260</option><option value="Corte barba y tinte (280 pesos)">Corte barba y tinte — 280</option><option value="Cejas (30 pesos)">Cejas — 30</option></select></div>
                    <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Barbero</label><select value={newBarber} onChange={e => setNewBarber(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm">{barbersList.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Fecha</label><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm" required /></div>
                    <div><label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Hora</label><input type="text" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm" required /></div>
                  </div>
                  <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-black py-4 rounded-xl hover:bg-amber-300 text-sm mt-2">Guardar Cita</button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}