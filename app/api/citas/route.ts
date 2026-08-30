import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const citas = await prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(citas);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nuevaCita = await prisma.appointment.create({
      data: {
        clientName: body.clientName || body.client || 'Cliente',
        clientPhone: body.clientPhone || body.phone || 'S/N',
        barberName: body.barberName || body.barber || 'Héctor (Master Barber)',
        appointmentDate: body.appointmentDate || body.date || new Date().toISOString().split('T')[0],
        appointmentTime: body.appointmentTime || body.time || '10:00 AM',
        service: body.service || 'Corte General',
        price: Number(body.price) || 350,
        note: body.note || 'Sin notas',
        status: 'pendiente',
      },
    });

    return NextResponse.json({ success: true, appointment: nuevaCita });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const citaActualizada = await prisma.appointment.update({
      where: { id: String(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, appointment: citaActualizada });
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

    await prisma.appointment.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}