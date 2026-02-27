// /app/api/providers/available/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const department = searchParams.get('department');
    const municipality = searchParams.get('municipality');

    if (!category || !department || !municipality) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: category, department, municipality' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching available providers with filters:', {
      category,
      department,
      municipality,
      is_active: true
    });

    // Query providers table with filters
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, user_id, phone, specialty, department, municipality')
      .eq('specialty', category)
      .eq('department', department)
      .eq('municipality', municipality)
      .eq('is_active', true);

    if (providersError) {
      console.error('❌ Error fetching providers:', providersError);
      return NextResponse.json(
        { success: false, error: providersError.message },
        { status: 500 }
      );
    }

    if (!providers || providers.length === 0) {
      console.log('ℹ️ No providers found matching criteria');
      return NextResponse.json({
        success: true,
        providers: [],
      });
    }

    // Fetch full names from profiles table
    const providersWithNames = await Promise.all(
      providers.map(async (provider) => {
        let full_name = 'Proveedor';
        
        if (provider.user_id) {
          try {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('auth_user_id', provider.user_id)
              .maybeSingle();

            if (userProfile?.full_name) {
              full_name = userProfile.full_name;
            }
          } catch (err) {
            console.warn('⚠️ Could not fetch profile for provider:', provider.id, err);
          }
        }

        return {
          id: provider.id,
          user_id: provider.user_id,
          full_name,
          phone: provider.phone,
          specialty: provider.specialty,
          department: provider.department,
          municipality: provider.municipality,
        };
      })
    );

    console.log(`✅ Found ${providersWithNames.length} available providers`);

    return NextResponse.json({
      success: true,
      providers: providersWithNames,
    });

  } catch (error: unknown) {
    console.error('❌ Unexpected error in /api/providers/available:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
