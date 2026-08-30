import { NextResponse } from 'next/server';

const SUPABASE_URL = 'https://lhtxvemwfjutxgofyeoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodHh2ZW13Zmp1dHhnb2Z5ZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzc4NTksImV4cCI6MjA4NjM1Mzg1OX0.qXQ5g7Q5l7b6s7b6s7b6s7b6s7b6s7b6s7b6s7b';

export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Appointment?select=*&order=createdAt.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    
    const data = await res.json();
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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Appointment`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(nuevaCita),
    });

    const data = await res.json();
    return NextResponse.json({ success: true, appointment: Array.isArray(data) ? data[0] : nuevaCita });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Appointment?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
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

    await fetch(`${SUPABASE_URL}/rest/v1/Appointment?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}