import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'PROVIDER',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: authUser.user.id,
    });
  } catch (error: any) {
    console.error('Error in create-user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
