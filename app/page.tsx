'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Calendar, Clock, Scissors, Star, ShieldCheck, Trash2, Lock, CheckCircle2, XCircle, Users, DollarSign, TrendingUp, Sparkles, Award, Flame, MessageSquare, ArrowRight, Check, UserCheck, ThumbsUp, Smile } from 'lucide-react';

export default function BelicsMasterApp() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const [returningUser, setReturningUser] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientService, setClientService] = useState('Corte (160 pesos)');
  const [clientBarber, setClientBarber] = useState('Cholo');
  const [clientDate, setClientDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientTime, setClientTime] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [barberUnavailable, setBarberUnavailable] = useState<{ [key: string]: boolean }>({});

  const barbersList = [
    { name: 'Cholo', role: 'Master Barber', phone: '6673602477' },
    { name: 'Eduardo', role: 'Senior Barber', phone: '6675757736' },
    { name: 'Gustavo', role: 'Gordito / Barber', phone: '6674535329' }
  ];

  const servicesList = [
    { title: 'Corte', price: '160 pesos', desc: 'Corte de cabello profesional adaptado a tu estilo.' },
    { title: 'Corte de niño', price: '120 pesos', desc: 'Corte especial y paciente para los pequeños del hogar.' },
    { title: 'Corte y barba', price: '260 pesos', desc: 'Corte completo y perfilado de barba con acabado impecable.' },
    { title: 'Corte barba y tinte', price: '280 pesos', desc: 'Servicio integral de corte, barba y aplicación de tinte.' },
    { title: 'Cejas', price: '30 pesos', desc: 'Diseño y perfilado rápido de cejas.' }
  ];

  // Reseñas reales de clientes
  const testimonials = [
    { name: 'Carlos Mendoza', comment: 'El mejor desvanecido de Culiacán. Cholo es un maestro con la navaja.', barber: 'Cholo' },
    { name: 'Alejandro Beltrán', comment: 'Excelente ambiente y puntualidad impecable. Eduardo rifa bastante.', barber: 'Eduardo' },
    { name: 'Jesús Valenzuela', comment: 'Gustavo te deja la barba perfecta con las toallas calientes. 10/10.', barber: 'Gustavo' }
  ];

  // Reproductor de sonido sutil de interfaz (Audio Feedback)
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  };

  const getAvailableTimesForDate = (dateStr: string) => {
    if (!dateStr) return [];
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const endHour = dayOfWeek === 0 ? 16 : 20; 
    
    let times = [];
    let currentHour = 11;
    let currentMinute = 0;

    while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
      const period = currentHour >= 12 ? 'PM' : 'AM';
      const displayHour = currentHour > 12 ? currentHour - 12 : currentHour;
      const formattedHour = displayHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      
      times.push(`${formattedHour}:${formattedMinute} ${period}`);
      currentMinute += 40;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    return times;
  };

  const availableTimes = getAvailableTimesForDate(clientDate);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(clientTime)) {
      setClientTime(availableTimes[0]);
    }
  }, [clientDate, availableTimes]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Cargar saludo personalizado si el usuario ya visitó o agendó antes
    const savedName = localStorage.getItem('belics_client_name');
    if (savedName) {
      setReturningUser(savedName);
      setClientName(savedName);
    }

    const fetchUnavailable = async () => {
      try {
        const res = await fetch('/api/ausencias');
        const data = await res.json();
        if (data && typeof data === 'object') setBarberUnavailable(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchUnavailable();
    const interval = setInterval(fetchUnavailable, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const isBarberOffOnDate = (barberName: string, date: string) => {
    return !!barberUnavailable[`${barberName}_${date}`];
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!clientName || !clientPhone || !clientService) {
      alert('Por favor completa tu nombre, teléfono y el servicio que deseas.');
      return;
    }

    if (clientBarber !== 'Cualquier Barbero Disponible' && isBarberOffOnDate(clientBarber, clientDate)) {
      alert(`Lo sentimos, el barbero ${clientBarber} no está disponible en la fecha seleccionada.`);
      return;
    }

    // Guardar en memoria local para saludarlo la próxima vez
    localStorage.setItem('belics_client_name', clientName);

    let numericPrice = 160;
    if (clientService.includes('120')) numericPrice = 120;
    if (clientService.includes('260')) numericPrice = 260;
    if (clientService.includes('280')) numericPrice = 280;
    if (clientService.includes('30')) numericPrice = 30;

    try {
      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
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
        setTimeout(() => setBookingSuccess(false), 6000);
        setClientPhone('');
        setClientNote('');
      } else {
        alert('Hubo un error al registrar la cita.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-100 font-sans selection:bg-amber-400 selection:text-black relative overflow-x-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none -z-10"></div>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {whatsappMenuOpen && (
          <div className="mb-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-64 space-y-2">
            <p className="text-[11px] font-black uppercase text-amber-400 tracking-wider mb-2">Contactar Barbero Directo</p>
            {barbersList.map((b) => (
              <a
                key={b.name}
                href={`https://wa.me/521${b.phone}?text=Hola%20${b.name},%20me%20gustaría%20consultar%20una%20cita%20en%20Belics%20Barbershop.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 p-2.5 rounded-xl text-xs font-bold text-white transition-colors"
              >
                <span>{b.name}</span>
                <span className="text-green-400 text-[10px]">WhatsApp ↗</span>
              </a>
            ))}
          </div>
        )}
        <button
          onClick={() => { playClickSound(); setWhatsappMenuOpen(!whatsappMenuOpen); }}
          className="w-14 h-14 bg-green-500 hover:bg-green-400 text-neutral-950 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all transform hover:scale-110 active:scale-95"
        >
          <Phone size={26} className="fill-current" />
        </button>
      </div>

      {/* NAVBAR */}
      <nav className={`fixed w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-[#070708]/90 backdrop-blur-2xl py-3 border-b border-neutral-800/80 shadow-2xl' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform bg-neutral-900 flex items-center justify-center">
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
            <a href="#inicio" className="hover:text-amber-400 transition-colors">INICIO</a>
            <a href="#resenas" className="hover:text-amber-400 transition-colors">RESEÑAS</a>
            <a href="#servicios" className="hover:text-amber-400 transition-colors">SERVICIOS</a>
            <a href="#cortes" className="hover:text-amber-400 transition-colors">ESTILOS</a>
            <a href="#ubicacion" className="hover:text-amber-400 transition-colors">UBICACIÓN</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin" onClick={playClickSound} className="bg-neutral-900/80 border border-neutral-800 text-amber-400 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all flex items-center gap-2">
              <ShieldCheck size={16} /> ADMIN
            </Link>
            <a href="#agendar" onClick={playClickSound} className="bg-amber-400 text-neutral-950 px-5 py-2.5 rounded-xl font-black text-xs hover:bg-amber-300 transition-all shadow-[0_0_25px_rgba(251,191,36,0.4)] tracking-wider">
              RESERVAR LUGAR
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION CON SALUDO PERSONALIZADO */}
      <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#070708]/60 z-10"></div>
          <img src="/fondo-belics.jpg" alt="Belics Barbershop" className="w-full h-full object-cover scale-105" />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-3xl">
            {returningUser ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 backdrop-blur-xl mb-6 text-amber-400 text-xs font-bold">
                <Smile size={16} /> ¡Qué bueno verte de nuevo, {returningUser}! ¿Listo para tu corte?
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl mb-8 shadow-2xl">
                <Star className="text-amber-400 fill-amber-400" size={16} />
                <span className="text-[11px] font-bold tracking-widest text-neutral-300 uppercase">Barbería Profesional & Grooming en Culiacán</span>
              </div>
            )}
            
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.95] mb-8 tracking-tighter">
              Elegancia <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">Sin Excepciones.</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-xl font-light leading-relaxed">
              Cortes clásicos, modernos y personalizados al detalle. Espacio diseñado para hombres que valoran su imagen y su tiempo.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="#agendar" onClick={playClickSound} className="bg-amber-400 text-neutral-950 px-8 py-4 rounded-2xl font-black text-sm hover:bg-amber-300 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(251,191,36,0.3)] tracking-wider">
                Apartar mi Silla <ArrowRight size={16} />
              </a>
              <a href="#servicios" className="bg-neutral-900/80 border border-neutral-800 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-neutral-800 transition-all">
                Ver Servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE RESEÑAS EN VIVO */}
      <section id="resenas" className="py-24 bg-[#070708] border-t border-neutral-900 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Com comunidad</span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Reseñas de <span className="text-amber-400">Clientes</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-neutral-900/40 border border-neutral-800 p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, idx) => <Star key={idx} size={16} className="fill-amber-400" />)}
                </div>
                <p className="text-neutral-300 text-sm italic font-light">"{t.comment}"</p>
                <div className="pt-4 border-t border-neutral-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{t.name}</span>
                  <span className="text-amber-400 font-medium">Atendido por {t.barber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 bg-neutral-900/20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3 block">Tarifas Oficiales</span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">Nuestros <span className="text-amber-400">Servicios</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              { tag: 'Clásico', title: 'Corte Ejecutivo', desc: 'Líneas limpias, perfecto para entorno formal.' },
              { tag: 'Moderno', title: 'Fade & Textura', desc: 'Desvanecido impecable con volumen.' },
              { tag: 'Natural', title: 'Tijera Tradicional', desc: 'Estilo clásico sin máquina.' },
              { tag: 'Grooming', title: 'Barba & Perfilado', desc: 'Cuidado especializado y suavidad.' }
            ].map((corte, i) => (
              <div key={i} className="rounded-3xl bg-neutral-900/80 p-8 border border-neutral-800 flex flex-col justify-between aspect-[4/5]">
                <Scissors className="text-amber-400" size={22} />
                <div>
                  <span className="text-[11px] font-extrabold text-amber-400 uppercase mb-2 block">{corte.tag}</span>
                  <h3 className="text-2xl font-black text-white mb-2">{corte.title}</h3>
                  <p className="text-neutral-400 text-xs">{corte.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENDAR */}
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

          <form onSubmit={handleBookingSubmit} className="bg-neutral-900/60 border border-neutral-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Tu Nombre Completo</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej. Alejandro Beltrán" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-amber-400" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Teléfono / WhatsApp</label>
                <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="667 000 0000" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-amber-400" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Selecciona tu Servicio</label>
                <select value={clientService} onChange={(e) => setClientService(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm cursor-pointer">
                  <option value="Corte (160 pesos)">Corte — 160 pesos</option>
                  <option value="Corte de niño (120 pesos)">Corte de niño — 120 pesos</option>
                  <option value="Corte y barba (260 pesos)">Corte y barba — 260 pesos</option>
                  <option value="Corte barba y tinte (280 pesos)">Corte barba y tinte — 280 pesos</option>
                  <option value="Cejas (30 pesos)">Cejas — 30 pesos</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-amber-400" /> Seleccionar Barbero
                </label>
                <select value={clientBarber} onChange={(e) => setClientBarber(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm cursor-pointer">
                  <option value="Cualquier Barbero Disponible">Cualquier Barbero Disponible</option>
                  {barbersList.map((barber) => {
                    const isOff = isBarberOffOnDate(barber.name, clientDate);
                    return (
                      <option key={barber.name} value={barber.name} disabled={isOff}>
                        {barber.name} ({barber.role}) {isOff ? ' — [NO DISPONIBLE / AUSENTE]' : '— [Disponible]'}
                      </option>
                    );
                  })}
                </select>
                {clientBarber !== 'Cualquier Barbero Disponible' && isBarberOffOnDate(clientBarber, clientDate) && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-semibold">⚠️ {clientBarber} se encuentra ausente en la fecha seleccionada.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Fecha</label>
                <input type="date" value={clientDate} onChange={(e) => setClientDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm cursor-pointer" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Hora Disponible (Cada 40 min)</label>
                <select value={clientTime} onChange={(e) => setClientTime(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm cursor-pointer">
                  {availableTimes.map((timeOption) => (
                    <option key={timeOption} value={timeOption}>{timeOption}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Notas o comentarios</label>
              <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Notas especiales..." rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm resize-none"></textarea>
            </div>

            <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-black py-4 rounded-xl hover:bg-amber-300 transition-all shadow-lg text-sm">
              Solicitar Cita al Sistema
            </button>
          </form>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="ubicacion" className="py-24 bg-[#070708] border-t border-neutral-900 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black uppercase mb-6">Ubicación <span className="text-amber-400">Belics</span></h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-4 font-light">Av Ramón López Velarde 3438, Terranova, 80143 Culiacán Rosales, Sin.</p>
          <p className="text-amber-400 font-bold text-lg">Teléfono Directo: 667 453 5329</p>
        </div>
      </section>

      <footer className="bg-[#040405] py-10 border-t border-neutral-900 text-center text-neutral-600 text-xs">
        © {new Date().getFullYear()} Belics Barbershop. Todos los derechos reservados.
      </footer>
    </div>
  );
}