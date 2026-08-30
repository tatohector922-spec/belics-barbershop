import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'citas.json');

function getStoredAppointments() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function GET() {
  const citas = getStoredAppointments();
  return NextResponse.json(citas);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const citas = getStoredAppointments();

    const nuevaCita = {
      id: Date.now().toString(),
      clientName: body.clientName || body.client || 'Cliente',
      clientPhone: body.clientPhone || body.phone || 'S/N',
      barberName: body.barberName || body.barber || 'Héctor (Master Barber)',
      appointmentDate: body.appointmentDate || body.date || new Date().toISOString().split('T')[0],
      appointmentTime: body.appointmentTime || body.time || '10:00 AM',
      service: body.service || 'Corte General',
      price: body.price || 350,
      note: body.note || 'Sin notas',
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    citas.unshift(nuevaCita);
    fs.writeFileSync(filePath, JSON.stringify(citas, null, 2));

    return NextResponse.json({ success: true, appointment: nuevaCita });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    let citas = getStoredAppointments();

    citas = citas.map((c: any) => c.id == id ? { ...c, status } : c);
    fs.writeFileSync(filePath, JSON.stringify(citas, null, 2));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    let citas = getStoredAppointments();

    citas = citas.filter((c: any) => c.id != id);
    fs.writeFileSync(filePath, JSON.stringify(citas, null, 2));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}