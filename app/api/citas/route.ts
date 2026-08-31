import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = 'https://lhtxvemwfjutxgofyeoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodHh2ZW13Zmp1dHhnb2Z5ZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzc4NTksImV4cCI6MjA4NjM1Mzg1OX0.qXQ5g7Q5l7b6s7b6s7b6s7b6s7b6s7b6s7b6s7b';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración segura de llaves VAPID
try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:tatohector@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCX9iMW4caZMYynEPYwbpWlJC23I37xMESR-cJwunLmSoQcxyF3ULBpInxpRhm7s8ah0HqbvbIpMPXlduwt7r7w',
    process.env.VAPID_PRIVATE_KEY || 'l46VSYypZ0mP2tF_xJC6mf4G4LrzddjckuSQB2c7uzs'
  );
} catch (e) {
  console.error("Error configurando webpush:", e);
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Appointment')
      .select('*')
      .order('id', { ascending: false });

    if (error) return NextResponse.json([]);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nuevaCita = {
      clientName: body.clientName || body.client || body.nombre || 'Cliente',
      clientPhone: body.clientPhone || body.phone || body.telefono || 'S/N',
      barberName: body.barberName || body.barber || body.barbero || 'Héctor (Master Barber)',
      appointmentDate: body.appointmentDate || body.date || body.fecha || new Date().toISOString().split('T')[0],
      appointmentTime: body.appointmentTime || body.time || body.hora || '10:00 AM',
      service: body.service || body.corte || 'Corte General',
      price: Number(body.price || body.precio) || 350,
      note: body.note || body.nota || 'Sin notas',
      status: 'pendiente',
    };

    // 1. Inserción principal en Supabase (Esto NUNCA debe fallar por culpa de las notificaciones)
    const { data, error } = await supabase
      .from('Appointment')
      .insert([nuevaCita])
      .select();

    if (error) {
      console.error("Error al insertar cita en Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 2. Bloque push aislado en un bloque try-catch totalmente independiente para que no afecte la cita
    try {
      const { data: subsData, error: subsError } = await supabase
        .from('PushSubscriptions')
        .select('*');

      if (!subsError && subsData && subsData.length > 0) {
        const payload = JSON.stringify({
          title: "Belics Barbershop - Nueva Cita",
          body: `Cliente: ${nuevaCita.clientName} con ${nuevaCita.barberName} (${nuevaCita.appointmentDate} - ${nuevaCita.appointmentTime})`
        });

        for (const sub of subsData) {
          if (sub.endpoint && sub.p256dh && sub.auth) {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            };
            webpush.sendNotification(pushSubscription, payload).catch(err => {
              console.error("Error enviando push individual:", err);
            });
          }
        }
      }
    } catch (pushErr) {
      console.log("Aviso: Notificación push omitida por seguridad:", pushErr);
    }

    return NextResponse.json({ success: true, appointment: data ? data[0] : nuevaCita });
  } catch (error: any) {
    console.error("Error general en POST citas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const { data, error } = await supabase.from('Appointment').update({ status }).eq('id', id).select();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID no proporcionado' }, { status: 400 });
    const { error } = await supabase.from('Appointment').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}