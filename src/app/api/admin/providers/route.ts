import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, phone, specialty, department, municipality } = await request.json();

    if (!user_id || !phone || !specialty || !department || !municipality) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('providers')
      .insert([{
        user_id,
        phone,
        specialty,
        department,
        municipality,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting provider:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, provider: data });
  } catch (error: any) {
    console.error('Error in providers API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
