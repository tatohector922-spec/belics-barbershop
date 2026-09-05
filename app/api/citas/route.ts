import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientName, 
      service, 
      price, 
      barberName, 
      appointmentDate, 
      appointmentTime, 
      clientPhone, 
      note 
    } = body;

    // Validación básica de campos obligatorios
    if (!clientName || !service || !barberName || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios para agendar la cita' },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. AQUÍ VA LA LÓGICA DE TU BASE DE DATOS
    // ==========================================
    // Ejemplo:
    // const newAppointment = await db.citas.create({ data: { ... } });
    
    // ==========================================
    // 2. DISPARAR EL WEBHOOK HACIA MAKE.COM
    // ==========================================
    try {
      const webhookUrl = 'https://hook.us2.make.com/mlydivxluvdbgjmm73i7n6f1v9o8mhvo';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          clientName,
          service,
          price,
          barberName,
          appointmentDate,
          appointmentTime,
          clientPhone,
          note
        })
      });
    } catch (webhookError) {
      // Si el webhook llegara a fallar por red, la cita ya se guardó y no rompemos la respuesta al usuario
      console.error('Error al notificar a Make.com:', webhookError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cita creada y notificación en proceso con éxito' 
    });

  } catch (error) {
    console.error('Error general en el servidor al procesar la cita:', error);
    return NextResponse.json( 
      { success: false, error: 'Error interno del servidor' }, 
      { status: 500 } 
    );
  }
}