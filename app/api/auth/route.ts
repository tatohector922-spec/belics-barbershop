import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';

// TU LLAVE SECRETA PERSONAL Y PRIVADA (Esta llave ya la tienes guardada en tu Google Authenticator del cel)
const MY_SECRET_KEY = 'JBSWY3DPEHPK3PXP';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    // Valida exclusivamente si el código de 6 dígitos viene de tu llave personal
    const verified = speakeasy.totp.verify({
      secret: MY_SECRET_KEY,
      encoding: 'base32',
      token: token,
      window: 1 // Margen de tolerancia de tiempo de 30s
    });

    if (verified) {
      return NextResponse.json({ success: true, message: 'Acceso autorizado' });
    } else {
      return NextResponse.json({ success: false, message: 'Código incorrecto' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}