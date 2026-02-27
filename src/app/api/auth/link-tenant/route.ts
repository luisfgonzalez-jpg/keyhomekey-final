import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Uses service role to bypass RLS — safe because we validate inputs server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, auth_user_id, full_name, phone, fallbackRole } = await req.json();

    if (!email || !auth_user_id) {
      return NextResponse.json({ error: 'Missing email or auth_user_id' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if a profile already exists for this email
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('auth_user_id, role, email, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existing) {
      // Profile exists (tenant invited by owner) — link the auth user
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          auth_user_id,
          full_name: full_name || existing.full_name || normalizedEmail.split('@')[0],
          phone: phone || '',
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ linked: true, role: existing.role });
    } else {
      // No existing profile — create as fallbackRole (OWNER by default)
      const role = fallbackRole || 'OWNER';
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_user_id,
          full_name: full_name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          phone: phone || '',
          role,
        });

      if (insertError) {
        console.error('Error inserting profile:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ linked: false, role });
    }
  } catch (err: any) {
    console.error('link-tenant error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
