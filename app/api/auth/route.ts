import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    // Utiliza la clave definida en tu .env o usa la de prueba por defecto
    const secret = process.env.TOTP_SECRET || 'JBSWY3DPEHPK3PXP'; 

    const isValid = authenticator.check(token, secret);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Código incorrecto' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error en el servidor' }, { status: 500 });
  }
}