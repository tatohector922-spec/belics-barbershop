import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Almacenamiento en memoria global del servidor como respaldo por si la tabla no está creada en Supabase
let globalAusenciasMemory: { [key: string]: boolean } = {};

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(globalAusenciasMemory);
    }

    const { data, error } = await supabase
      .from('configuraciones')
      .select('valor')
      .eq('clave', 'ausencias')
      .single();

    if (error || !data) {
      return NextResponse.json(globalAusenciasMemory);
    }

    const parsed = JSON.parse(data.valor || '{}');
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(globalAusenciasMemory);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    globalAusenciasMemory = body; // Actualizar memoria del servidor
    const valorJson = JSON.stringify(body);

    if (!supabase) {
      return NextResponse.json({ success: true, source: 'memory' });
    }

    // Intentar guardar en Supabase
    const { error } = await supabase
      .from('configuraciones')
      .upsert({ clave: 'ausencias', valor: valorJson }, { onConflict: 'clave' });

    if (error) {
      // Si la tabla 'configuraciones' no existe en Supabase, no rompemos la app, usamos memoria compartida
      return NextResponse.json({ success: true, warning: 'Tabla configuraciones no existe, usando memoria' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}