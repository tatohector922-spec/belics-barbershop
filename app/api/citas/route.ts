import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhtxvemwfjutxgofyeoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodHh2ZW13Zmp1dHhnb2Z5ZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzc4NTksImV4cCI6MjA4NjM1Mzg1OX0.qXQ5g7Q5l7b6s7b6s7b6s7b6s7b6s7b6s7b6s7b';

// Inicializamos el cliente oficial de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET() {
  try {
    // Intentamos consultar la tabla 'Appointment' (como la creó Prisma)
    let { data, error } = await supabase
      .from('Appointment')
      .select('*')
      .order('createdAt', { ascending: false });

    // Si da error o viene vacío, intentamos con minúsculas 'appointment'
    if (error || !data || data.length === 0) {
      const resAlt = await supabase
        .from('appointment')
        .select('*')
        .order('createdAt', { ascending: false });
      data = resAlt.data;
      error = resAlt.error;
    }

    if (error) {
      console.error("Error de Supabase GET:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nuevaCita = {
      clientName: body.clientName || body.client || 'Cliente',
      clientPhone: body.clientPhone || body.phone || 'S/N',
      barberName: body.barberName || body.barber || 'Héctor (Master Barber)',
      appointmentDate: body.appointmentDate || body.date || new Date().toISOString().split('T')[0],
      appointmentTime: body.appointmentTime || body.time || '10:00 AM',
      service: body.service || 'Corte General',
      price: Number(body.price) || 350,
      note: body.note || 'Sin notas',
      status: 'pendiente',
    };

    // Insertamos usando el cliente oficial en 'Appointment'
    let { data, error } = await supabase
      .from('Appointment')
      .insert([nuevaCita])
      .select();

    // Si falla, intentamos en minúsculas
    if (error) {
      const resAlt = await supabase
        .from('appointment')
        .insert([nuevaCita])
        .select();
      data = resAlt.data;
      error = resAlt.error;
    }

    if (error) {
      console.error("Error de Supabase POST:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data ? data[0] : nuevaCita });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    let { data, error } = await supabase
      .from('Appointment')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      const resAlt = await supabase
        .from('appointment')
        .update({ status })
        .eq('id', id)
        .select();
      data = resAlt.data;
      error = resAlt.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID no proporcionado' }, { status: 400 });
    }

    let { error } = await supabase
      .from('Appointment')
      .delete()
      .eq('id', id);

    if (error) {
      const resAlt = await supabase
        .from('appointment')
        .delete()
        .eq('id', id);
      error = resAlt.error;
    }

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}