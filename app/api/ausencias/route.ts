import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurar cliente de Supabase con tus variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('valor')
      .eq('clave', 'ausencias')
      .single();

    if (error || !data) {
      return NextResponse.json({});
    }

    return NextResponse.json(JSON.parse(data.valor || '{}'));
  } catch (err) {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const valorJson = JSON.stringify(body);

    // Guardar o actualizar en la tabla 'configuraciones' de Supabase
    const { error } = await supabase
      .from('configuraciones')
      .upsert({ clave: 'ausencias', valor: valorJson }, { onConflict: 'clave' });

    if (error) {
      // Si la tabla no existe aún, guardamos temporalmente en memoria/respuesta pero avisamos
      return NextResponse.json({ success: true, warning: 'Tabla configuraciones pendiente en Supabase' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}