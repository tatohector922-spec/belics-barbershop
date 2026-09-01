import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Evitar que falle en el build si las variables no están inyectadas todavía
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({});

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

    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Supabase no configurado' }, { status: 500 });
    }

    const { error } = await supabase
      .from('configuraciones')
      .upsert({ clave: 'ausencias', valor: valorJson }, { onConflict: 'clave' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}