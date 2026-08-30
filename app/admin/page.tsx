'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Users, DollarSign, TrendingUp, CheckCircle2, XCircle, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  // Cambiamos el inicio predeterminado a 'pending' para que al entrar vea las citas nuevas de inmediato
  const [adminTab, setAdminTab] = useState<'today' | 'week' | 'month' | 'year' | 'pending' | 'cancelled' | 'barbers'>('pending');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<'Héctor (Master Barber)' | 'Alexis (Senior Barber)'>('Héctor (Master Barber)');

  // Citas reales obtenidas desde la base de datos (Prisma / API)
  const [appointments, setAppointments] = useState<any[]>([]);

  // Función para cargar las citas de la base de datos
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/citas');
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          client: item.clientName,
          service: item.service || 'Corte General',
          barber: item.barberName,
          time: item.appointmentTime,
          phone: item.clientPhone,
          date: item.appointmentDate,
          note: item.note || 'Sin notas adicionales.',
          status: item.status === 'pendiente' ? 'pending' : item.status === 'confirmada' ? 'confirmed' : 'cancelled',
          price: item.price || 350
        }));
        setAppointments(formatted);
      }
    } catch (err) {
      console.error('Error al cargar citas de la BD:', err);
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
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        alert('Código de autenticación incorrecto o expirado.');
      }
    } catch (err) {
      alert('Error al verificar el código.');
    }
  };

  const updateAppointmentStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    const dbStatus = newStatus === 'confirmed' ? 'confirmada' : 'cancelada';
    try {
      const res = await fetch('/api/citas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: dbStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      const res = await fetch(`/api/citas?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayConfirmedAppointments = appointments.filter(a => a.date === todayStr && a.status === 'confirmed');
  const totalRevenueToday = todayConfirmedAppointments.reduce((acc, curr) => acc + curr.price, 0);

  const filteredAppointments = appointments.filter(appt => {
    if (adminTab === 'pending') return appt.status === 'pending';
    if (adminTab === 'cancelled') return appt.status === 'cancelled';
    if (adminTab === 'today') return appt.date === todayStr; // Muestra todas las de hoy sin importar si están pendientes o confirmadas
    return true; 
  });

  return (
    <div className="min-h-screen bg-[#040405] text-neutral-100 font-sans p-6 sm:p-10 relative">
      
      {/* BOTÓN PARA REGRESAR AL SITIO WEB */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl">
          <ArrowLeft size={16} /> Volver a Belics Barbershop
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/50 bg-neutral-900 flex items-center justify-center">
            <img src="/image.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-black tracking-wider uppercase">Belics Gerencia</span>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl mt-16 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/30">
              <Lock className="text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Acceso Gerencial Seguro</h3>
              <p className="text-xs text-neutral-400">Introduce el código de Google Authenticator</p>
            </div>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase mb-2 tracking-widest">Código de 6 Dígitos</label>
              <input 
                type="text" 
                maxLength={6}
                value={totpCode} 
                onChange={(e) => setTotpCode(e.target.value)} 
                placeholder="000 000"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-4 text-white text-center tracking-[0.6em] text-2xl font-black focus:outline-none focus:border-amber-400 transition-colors"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-black py-4 rounded-xl hover:bg-amber-300 transition-all shadow-lg tracking-wide text-sm mt-2">
              Validar y Entrar al Sistema
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* CABECERA DEL PANEL */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900/60 border border-neutral-800 p-8 rounded-3xl gap-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/30">
                <ShieldCheck className="text-green-400" size={30} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Panel de Control Ejecutivo</h1>
                <p className="text-xs text-green-400 font-medium">● Sesión Segura Verificada 2FA · Base de Datos Conectada</p>
              </div>
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="text-xs text-neutral-400 hover:text-red-400 border border-neutral-800 bg-neutral-950 px-5 py-3 rounded-xl font-bold transition-colors">
              Cerrar Sesión
            </button>
          </div>

          {/* MÉTRICAS FINANCIERAS Y ESTADÍSTICAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-400/20">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Total Solicitudes</p>
                <p className="text-2xl font-black">{appointments.length}</p>
              </div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-400/10 rounded-2xl flex items-center justify-center text-green-400 border border-green-400/20">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Ingresos Reales Hoy (Confirmadas)</p>
                <p className="text-2xl font-black text-green-400">${totalRevenueToday} MXN</p>
              </div>
            </div>
            <div className="bg-neutral-900/60 p-6 rounded-3xl border border-neutral-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-400/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-400/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Citas Confirmadas Hoy</p>
                <p className="text-2xl font-black">{todayConfirmedAppointments.length}</p>
              </div>
            </div>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN DEL PANEL */}
          <div className="flex flex-wrap gap-2 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
            {[
              { id: 'pending', label: `📥 Pendientes (${appointments.filter(a => a.status === 'pending').length})` },
              { id: 'today', label: '📅 Citas de Hoy' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'year', label: 'Año' },
              { id: 'cancelled', label: `Canceladas (${appointments.filter(a => a.status === 'cancelled').length})` },
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

          {/* CONTENEDOR DE LA AGENDA */}
          <div className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-3xl space-y-4">
            {adminTab === 'barbers' ? (
              <div className="space-y-4">
                <div className="flex gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 items-center justify-between flex-wrap">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Seleccionar Estación:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedBarberFilter('Héctor (Master Barber)')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedBarberFilter === 'Héctor (Master Barber)' ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
                    >
                      Héctor (Master Barber)
                    </button>
                    <button 
                      onClick={() => setSelectedBarberFilter('Alexis (Senior Barber)')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedBarberFilter === 'Alexis (Senior Barber)' ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
                    >
                      Alexis (Senior Barber)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <h4 className="font-bold text-amber-400 text-sm mb-1">✂️ Agenda Asignada para {selectedBarberFilter}</h4>
                  <p className="text-xs text-neutral-400">Listado exclusivo de citas confirmadas para preparar el espacio.</p>
                </div>

                {appointments.filter(a => a.barber === selectedBarberFilter && a.status === 'confirmed').length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 text-sm font-light">
                    No hay citas confirmadas para {selectedBarberFilter}.
                  </div>
                ) : (
                  appointments.filter(a => a.barber === selectedBarberFilter && a.status === 'confirmed').map(appt => (
                    <div key={appt.id} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-white text-base">{appt.client} - <span className="text-amber-400">{appt.service}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                        <p className="text-xs text-amber-200/80 mt-2 bg-neutral-900 p-2 rounded-lg border border-neutral-800">Nota: {appt.note}</p>
                      </div>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-full font-bold shrink-0">Confirmada</span>
                    </div>
                  ))
                )}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 text-sm font-light">
                No hay registros en esta vista.
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-950 p-6 rounded-2xl border border-neutral-800 gap-4 hover:border-neutral-700 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-white text-lg">{appt.client}</p>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 font-bold">
                        {appt.service} (${appt.price} MXN)
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-blue-400 font-bold">
                        Barbero: {appt.barber}
                      </span>
                      {appt.status === 'pending' && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black uppercase">
                          Por Confirmar
                        </span>
                      )}
                      {appt.status === 'confirmed' && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-black uppercase">
                          Confirmada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">📅 Fecha: {appt.date} · ⏰ Hora: {appt.time} · 📞 Tel: {appt.phone}</p>
                    {appt.note && (
                      <p className="text-xs text-amber-200/80 bg-neutral-900 p-3 rounded-xl border border-neutral-800 mt-2">
                        <span className="font-bold text-amber-400">Nota del cliente:</span> {appt.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                    {appt.status === 'pending' && (
                      <button 
                        onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                        className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-neutral-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> Confirmar
                      </button>
                    )}
                    {appt.status !== 'cancelled' && (
                      <button 
                        onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle size={16} /> Cancelar
                      </button>
                    )}
                    <button 
                      onClick={() => deleteAppointment(appt.id)}
                      className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 p-3 rounded-xl transition-colors"
                      title="Eliminar Registro"
                    >
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