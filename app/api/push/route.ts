import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhtxvemwfjutxgofyeoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodHh2ZW13Zmp1dHhnb2Z5ZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzc4NTksImV4cCI6MjA4NjM1Mzg1OX0.qXQ5g7Q5l7b6s7b6s7b6s7b6s7b6s7b6s7b6s7b';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: 'Suscripción inválida' }, { status: 400 });
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';

    // Guardamos o actualizamos en Supabase de forma segura
    const { error } = await supabase
      .from('PushSubscriptions')
      .upsert([{ endpoint, p256dh, auth }], { onConflict: 'endpoint' });

    if (error) {
      console.error('Error guardando suscripción en BD:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}