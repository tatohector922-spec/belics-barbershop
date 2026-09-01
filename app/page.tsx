'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Calendar, Clock, Scissors, Star, ShieldCheck, Trash2, Lock, CheckCircle2, XCircle, Users, DollarSign, TrendingUp, Sparkles, Award, Flame, MessageSquare, ArrowRight, Check, UserCheck } from 'lucide-react';

export default function BelicsMasterApp() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Formulario del cliente (por defecto el primer servicio de la lista nueva)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientService, setClientService] = useState('Corte (160 pesos)');
  const [clientBarber, setClientBarber] = useState('Cholo');
  const [clientDate, setClientDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientTime, setClientTime] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Estado para leer qué barberos están ausentes según el admin
  const [barberUnavailable, setBarberUnavailable] = useState<{ [key: string]: boolean }>({});

  // Lista de los 3 barberos oficiales
  const barbersList = [
    { name: 'Cholo', role: 'Master Barber' },
    { name: 'Eduardo', role: 'Senior Barber' },
    { name: 'Gustavo', role: 'Gordito / Barber' }
  ];

  // Nuevos servicios oficiales con sus precios reales
  const servicesList = [
    { title: 'Corte', price: '160 pesos', desc: 'Corte de cabello profesional adaptado a tu estilo.' },
    { title: 'Corte y barba', price: '260 pesos', desc: 'Corte completo y perfilado de barba con acabado impecable.' },
    { title: 'Corte barba y tinte', price: '280 pesos', desc: 'Servicio integral de corte, barba y aplicación de tinte.' },
    { title: 'Cejas', price: '20 pesos', desc: 'Diseño y perfilado rápido de cejas.' }
  ];

  // Generar horarios estrictamente de 40 en 40 minutos (De 11:00 AM a 8:00 PM, Domingos de 11:00 AM a 4:00 PM)
  const getAvailableTimesForDate = (dateStr: string) => {
    if (!dateStr) return [];
    
    // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    
    // Domingo (0): de 11:00 AM a 4:00 PM (16:00)
    // Lunes a Sábado (1-6): de 11:00 AM a 8:00 PM (20:00)
    const endHour = dayOfWeek === 0 ? 16 : 20; 
    
    let times = [];
    let currentHour = 11; // Empieza a las 11:00 AM
    let currentMinute = 0;

    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
      const period = currentHour >= 12 ? 'PM' : 'AM';
      const displayHour = currentHour > 12 ? currentHour - 12 : currentHour;
      const formattedHour = displayHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      
      times.push(`${formattedHour}:${formattedMinute} ${period}`);

      // Incrementar exactamente 40 minutos
      currentMinute += 40;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return times;
  };

  const availableTimes = getAvailableTimesForDate(clientDate);

  // Asegurar que la hora seleccionada por defecto sea válida al cambiar de fecha
  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(clientTime)) {
      setClientTime(availableTimes[0]);
    }
  }, [clientDate, availableTimes]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const loadUnavailableStatus = () => {
      const savedUnavailable = localStorage.getItem('belics_barber_unavailable');
      if (savedUnavailable) {
        try {
          setBarberUnavailable(JSON.parse(savedUnavailable));
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadUnavailableStatus();
    window.addEventListener('storage', loadUnavailableStatus);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', loadUnavailableStatus);
    };
  }, []);

  const isBarberOffOnDate = (barberName: string, date: string) => {
    return !!barberUnavailable[`${barberName}_${date}`];
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !clientService) {
      alert('Por favor completa tu nombre, teléfono y el servicio que deseas.');
      return;
    }

    if (clientBarber !== 'Cualquier Barbero Disponible' && isBarberOffOnDate(clientBarber, clientDate)) {
      alert(`Lo sentimos, el barbero ${clientBarber} no está disponible en la fecha seleccionada. Por favor elige otro.`);
      return;
    }

    // Calcular precio numérico para la base de datos
    let numericPrice = 160;
    if (clientService.includes('260')) numericPrice = 260;
    if (clientService.includes('280')) numericPrice = 280;
    if (clientService.includes('20')) numericPrice = 20;

    try {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName,
          clientPhone: clientPhone,
          service: clientService,
          barberName: clientBarber,
          appointmentDate: clientDate,
          appointmentTime: clientTime,
          note: clientNote || 'Sin notas adicionales.',
          price: numericPrice
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        setTimeout(() => setBookingSuccess(false), 5000);
        setClientName('');
        setClientPhone('');
        setClientNote('');
      } else {
        alert('Hubo un error al registrar la cita en el sistema.');
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-100 font-sans selection:bg-amber-400 selection:text-black relative overflow-x-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>

      {/* BARRA DE NAVEGACIÓN */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#070708]/90 backdrop-blur-2xl py-3 border-b border-neutral-800/80 shadow-[0_15px_40px_rgba(0,0,0,0.9)]' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform duration-300 bg-neutral-900 flex items-center justify-center">
              <img src="/image.png" alt="Logo Belics" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400 block leading-none">
                Belics<span className="text-amber-400">.</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-amber-400/80 uppercase">Barbershop</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest text-neutral-400">
            <a href="#inicio" className="hover:text-amber-400 transition-colors duration-300">INICIO</a>
            <a href="#filosofia" className="hover:text-amber-400 transition-colors duration-300">FILOSOFÍA</a>
            <a href="#servicios" className="hover:text-amber-400 transition-colors duration-300">SERVICIOS</a>
            <a href="#cortes" className="hover:text-amber-400 transition-colors duration-300">ESTILOS</a>
            <a href="#ubicacion" className="hover:text-amber-400 transition-colors duration-300">UBICACIÓN</a>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin"
              className="bg-neutral-900/80 border border-neutral-800 text-amber-400 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 hover:border-amber-400/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-md"
            >
              <ShieldCheck size={16} /> ADMIN
            </Link>
            <a href="#agendar" className="bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 px-5 py-2.5 rounded-xl font-black text-xs hover:from-amber-300 hover:to-amber-400 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(251,191,36,0.4)] tracking-wider">
              RESERVAR LUGAR
            </a>
          </div>
        </div>
      </nav>

      {/* SECCIÓN HERO */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#070708]/60 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/40 to-transparent z-10"></div>
          <img src="/fondo-belics.jpg" alt="Belics Barbershop" className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl mb-8 shadow-2xl">
              <Star className="text-amber-400 fill-amber-400" size={16} />
              <span className="text-[11px] font-bold tracking-widest text-neutral-300 uppercase">Barbería Profesional & Grooming en Culiacán</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.95] mb-8 tracking-tighter">
              Elegancia <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Sin Excepciones.</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-xl font-light leading-relaxed">
              Cortes clásicos, modernos y personalizados al detalle. Espacio diseñado para hombres que valoran su imagen y su tiempo.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="#agendar" className="bg-amber-400 text-neutral-950 px-8 py-4 rounded-2xl font-black text-sm hover:bg-amber-300 transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(251,191,36,0.3)] tracking-wider group">
                Apartar mi Silla <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#servicios" className="bg-neutral-900/80 border border-neutral-800 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-neutral-800 transition-all backdrop-blur-md">
                Ver Servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FILOSOFÍA */}
      <section id="filosofia" className="py-24 bg-[#070708] relative z-20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Estándar Belics</span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
                Precisión en cada corte, <br /><span className="text-neutral-400">atención personalizada.</span>
              </h2>
              <p className="text-neutral-400 font-light leading-relaxed mb-8">
                Combinamos técnicas tradicionales de barbería con las últimas tendencias de estilismo masculino. Cada servicio está respaldado por altos estándares de higiene y confort.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800/80">
                  <p className="text-3xl font-black text-amber-400 mb-1">4.9 ★</p>
                  <p className="text-xs text-neutral-400 font-medium">Calificación Promedio</p>
                </div>
                <div className="bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800/80">
                  <p className="text-3xl font-black text-amber-400 mb-1">100%</p>
                  <p className="text-xs text-neutral-400 font-medium">Profesionalismo</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-amber-700 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-neutral-900/80 border border-neutral-800 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
                <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20">
                  <Sparkles className="text-amber-400" size={24} />
                </div>
                <h3 className="text-2xl font-bold">Ambiente Ejecutivo</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Disfruta de instalaciones climatizadas, excelente atención y un espacio ideal para relajarte mientras cuidas tu apariencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUEVOS SERVICIOS Y PRECIOS */}
      <section id="servicios" className="py-24 bg-neutral-900/20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Tarifas Oficiales</span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Nuestros <span className="text-amber-400">Servicios</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesList.map((item, i) => (
              <div key={i} className="bg-neutral-900/40 border border-neutral-800/80 p-8 rounded-3xl hover:border-amber-400/50 transition-all shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center border border-neutral-800">
                      <Scissors className="text-amber-400" size={26} />
                    </div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">{item.price}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTILOS Y CORTES */}
      <section id="cortes" className="py-24 bg-[#070708] border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Versatilidad</span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Estilos de <span className="text-amber-400">Referencia</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { tag: 'Clásico', title: 'Corte Ejecutivo', desc: 'Líneas limpias, perfecto para un entorno profesional y formal.' },
              { tag: 'Moderno', title: 'Fade & Textura', desc: 'Desvanecido impecable con volumen y movimiento natural arriba.' },
              { tag: 'Natural', title: 'Tijera Tradicional', desc: 'Estilo clásico sin máquina, ideal para caballeros con estilo.' },
              { tag: 'Grooming', title: 'Barba & Perfilado', desc: 'Cuidado especializado para mantener simetría y suavidad.' }
            ].map((corte, i) => (
              <div key={i} className="group relative rounded-3xl overflow-hidden bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-8 border border-neutral-800 hover:border-amber-400/55 transition-all shadow-2xl flex flex-col justify-between aspect-[4/5]">
                <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20 mb-6">
                  <Scissors className="text-amber-400" size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-amber-400 tracking-widest uppercase mb-2 block">{corte.tag}</span>
                  <h3 className="text-2xl font-black text-white mb-2">{corte.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">{corte.desc}</p>
                </div>
                <div className="pt-6 border-t border-neutral-800/80 mt-4 flex justify-between items-center text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                  <span>Belics Standard</span>
                  <span className="text-amber-400">Personalizable</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVAS CON SELECTOR DE LOS NUEVOS SERVICIOS, 40 MIN Y BLOQUEOS DE BARBEROS */}
      <section id="agendar" className="py-24 bg-neutral-900/10 border-t border-neutral-900 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Sistema de Citas</span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-3">
              Aparta tu <span className="text-amber-400">Lugar</span>
            </h2>
            <p className="text-neutral-400 text-sm max-w-lg mx-auto font-light">
              Lunes a Sábado de 11:00 AM a 8:00 PM · Domingos de 11:00 AM a 4:00 PM (Turnos de 40 en 40 min).
            </p>
          </div>

          {bookingSuccess && (
            <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-3">
              <Check size={20} />
              <span className="text-xs font-bold">¡Solicitud enviada con éxito! Quedó pendiente de confirmación en nuestro sistema.</span>
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="bg-neutral-900/60 border border-neutral-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider">Tu Nombre Completo</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Alejandro Beltrán" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider">Teléfono / WhatsApp</label>
                <input 
                  type="text" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="667 000 0000" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider">Selecciona tu Servicio</label>
                <select 
                  value={clientService}
                  onChange={(e) => setClientService(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm cursor-pointer"
                >
                  <option value="Corte (160 pesos)">Corte — 160 pesos</option>
                  <option value="Corte y barba (260 pesos)">Corte y barba — 260 pesos</option>
                  <option value="Corte barba y tinte (280 pesos)">Corte barba y tinte — 280 pesos</option>
                  <option value="Cejas (20 pesos)">Cejas — 20 pesos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-amber-400" /> Seleccionar Barbero
                </label>
                <select 
                  value={clientBarber}
                  onChange={(e) => setClientBarber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm cursor-pointer"
                >
                  <option value="Cualquier Barbero Disponible">Cualquier Barbero Disponible</option>
                  {barbersList.map((barber) => {
                    const isOff = isBarberOffOnDate(barber.name, clientDate);
                    return (
                      <option 
                        key={barber.name} 
                        value={barber.name} 
                        disabled={isOff}
                      >
                        {barber.name} ({barber.role}) {isOff ? ' — [NO DISPONIBLE / AUSENTE]' : '— [Disponible]'}
                      </option>
                    );
                  })}
                </select>
                {clientBarber !== 'Cualquier Barbero Disponible' && isBarberOffOnDate(clientBarber, clientDate) && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-semibold">
                    ⚠️ {clientBarber} se encuentra ausente en la fecha seleccionada. Por favor selecciona otro barbero.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider">Fecha</label>
                <input 
                  type="date" 
                  value={clientDate}
                  onChange={(e) => setClientDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider">Hora Disponible (Cada 40 min)</label>
                <select 
                  value={clientTime}
                  onChange={(e) => setClientTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm cursor-pointer"
                >
                  {availableTimes.map((timeOption) => (
                    <option key={timeOption} value={timeOption}>{timeOption}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 tracking-wider flex items-center gap-2">
                <MessageSquare size={14} className="text-amber-400" /> Notas o comentarios especiales
              </label>
              <textarea 
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder="Ej. Me gusta más largo arriba, perfilado de barba con toallas calientes..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-400 transition-colors text-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-black py-4 rounded-xl hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all duration-300 shadow-[0_0_30px_rgba(251,191,36,0.3)] tracking-wide text-sm">
                Solicitar Cita al Sistema
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="ubicacion" className="py-24 bg-[#070708] border-t border-neutral-900 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Encuéntranos</span>
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-6">
            Ubicación <span className="text-amber-400">Belics</span>
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-4 font-light">
            Av Ramón López Velarde 3438, entre Flor de Liz y Torres Gemelas, Terranova, 80143 Culiacán Rosales, Sin.
          </p>
          <p className="text-amber-400 font-bold text-lg tracking-wider">Teléfono Directo: 667 453 5329</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#040405] py-10 border-t border-neutral-900 text-center">
        <p className="text-neutral-600 text-xs font-medium tracking-wider">
          © {new Date().getFullYear()} Belics Barbershop. Desarrollado con Estándar Elite por Héctor Figueroa.
        </p>
      </footer>

    </div>
  );
}