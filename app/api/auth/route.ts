import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Función estándar para validar códigos TOTP (Google Authenticator) sin dependencias externas complejas
function verifyTOTP(token: string, secretBase32: string): boolean {
  try {
    // Decodificar Base32 a Buffer
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23457';
    let bits = '';
    let hex = '';

    const cleanSecret = secretBase32.replace(/=+$/, '').toUpperCase();
    for (let i = 0; i < cleanSecret.length; i++) {
      const val = base32chars.indexOf(cleanSecret[i]);
      if (val === -1) return false;
      bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      hex += parseInt(bits.substr(i, 8), 2).toString(16).padStart(2, '0');
    }
    const secretBuffer = Buffer.from(hex, 'hex');

    // Tiempo actual en ventanas de 30 segundos (permitiendo un margen de tolerancia de 1 ventana antes o después por desfase de reloj)
    const epoch = Math.floor(Date.now() / 1000);
    const step = 30;
    const counter = Math.floor(epoch / step);

    for (let i = -1; i <= 1; i++) {
      const timeCounter = counter + i;
      const buffer = Buffer.alloc(8);
      let tmp = timeCounter;
      for (let j = 7; j >= 0; j--) {
        buffer[j] = tmp & 0xff;
        tmp = Math.floor(tmp / 256);
      }

      const hmac = crypto.createHmac('sha1', secretBuffer);
      hmac.update(buffer);
      const hmacResult = hmac.digest();

      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const code = ((hmacResult[offset] & 0x7f) << 24) |
                   ((hmacResult[offset + 1] & 0xff) << 16) |
                   ((hmacResult[offset + 2] & 0xff) << 8) |
                   (hmacResult[offset + 3] & 0xff);

      const generatedToken = (code % 1000000).toString().padStart(6, '0');

      if (generatedToken === token.trim()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const secret = process.env.TOTP_SECRET || 'JBSWY3DPEHPK3PXP'; 

    if (!token) {
      return NextResponse.json({ success: false, message: 'Falta el token' }, { status: 400 });
    }

    const isValid = verifyTOTP(token, secret);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Código incorrecto' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error en el servidor' }, { status: 500 });
  }
}