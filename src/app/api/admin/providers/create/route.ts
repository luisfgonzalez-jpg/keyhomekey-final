import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(bytes[i] % chars.length);
  }
  return password;
}

export async function POST(request: Request) {
  try {
    // Verify admin auth
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins pueden crear proveedores' }, { status: 403 });
    }

    const { name, email, phone, specialty, department, municipality, password } = await request.json();

    if (!name || !email || !phone || !specialty || !department || !municipality) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Use service role to create user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const finalPassword = password || generatePassword();

    // 1. Create user in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
    }

    const userId = authUser.user.id;

    // 2. Create profile in users_profiles
    const { error: profileError } = await supabaseAdmin
      .from('users_profiles')
      .insert({
        user_id: userId,
        name,
        email,
        phone,
        role: 'PROVIDER',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Create provider in providers table
    const { data: provider, error: providerError } = await supabaseAdmin
      .from('providers')
      .insert({
        user_id: userId,
        phone,
        specialty,
        department,
        municipality,
        is_active: true,
      })
      .select()
      .single();

    if (providerError) {
      console.error('Error creating provider:', providerError);
      await supabaseAdmin.from('users_profiles').delete().eq('user_id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: providerError.message }, { status: 500 });
    }

    console.log('Provider created successfully:', { name, email });

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        user_id: userId,
        name,
        email,
      },
      temporaryPassword: finalPassword,
    });
  } catch (error: any) {
    console.error('Error in create provider:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
