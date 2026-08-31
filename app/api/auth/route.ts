import { NextResponse } from 'next/server';
import * as otplib from 'otplib';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const secret = process.env.TOTP_SECRET || 'JBSWY3DPEHPK3PXP'; 

    const authenticator = otplib.authenticator || (otplib as any).default?.authenticator;
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