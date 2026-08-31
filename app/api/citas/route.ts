import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = 'https://lhtxvemwfjutxgofyeoc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pT0qCOznBWl030ZK0VO03Q_bp7mvdVT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:tatohector@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCX9iMW4caZMYynEPYwbpWlJC23I37xMESR-cJwunLmSoQcxyF3ULBpInxpRhm7s8ah0HqbvbIpMPXlduwt7r7w',
    process.env.VAPID_PRIVATE_KEY || 'l46VSYypZ0mP2tF_xJC6mf4G4LrzddjckuSQB2c7uzs'
  );
} catch (e) {
  console.error("Error push:", e);
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

    const clientName = body.clientName || body.client || body.nombre || 'Cliente';
    const clientPhone = body.clientPhone || body.phone || body.telefono || 'S/N';
    const barberName = body.barberName || body.barber || body.barbero || 'Héctor (Master Barber)';
    const appointmentDate = body.appointmentDate || body.date || body.fecha || new Date().toISOString().split('T')[0];
    const appointmentTime = body.appointmentTime || body.time || body.hora || '10:00 AM';
    const service = body.service || body.corte || 'Corte General';
    const price = Number(body.price || body.precio) || 350;
    const note = body.note || body.nota || 'Sin notas';
    const status = 'pendiente';

    const nuevaCita = {
      clientName,
      clientphone: clientPhone,
      clientPhone,
      barberName,
      barbername: barberName,
      appointmentDate,
      appointmentdate: appointmentDate,
      appointmentTime,
      appointmenttime: appointmentTime,
      service,
      price,
      note,
      status
    };

    const { data, error } = await supabase
      .from('Appointment')
      .insert([nuevaCita])
      .select();

    if (error) {
      console.error("Error crítico de Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    try {
      const { data: subsData } = await supabase.from('PushSubscriptions').select('*');
      if (subsData && subsData.length > 0) {
        const payload = JSON.stringify({
          title: "Belics Barbershop - Nueva Cita",
          body: `Cliente: ${clientName} con ${barberName} (${appointmentDate} - ${appointmentTime})`
        });

        for (const sub of subsData) {
          if (sub.endpoint && sub.p256dh && sub.auth) {
            webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.log("Push omitido:", e);
    }

    return NextResponse.json({ success: true, appointment: data ? data[0] : nuevaCita });
  } catch (error: any) {
    console.error("Excepción en POST:", error);
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