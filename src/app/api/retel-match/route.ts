import { NextResponse } from 'next/server';

interface RetelMatchRequest {
  category: string;
  description: string;
  priority: string;
  location: {
    department: string;
    municipality: string;
  };
  ticketId: string;
}

interface RetelProvider {
  id: string;
  name: string;
  phone: string | null;
  specialty: string;
  department: string;
  municipality: string;
  rating?: number;
}

interface RetelApiResponse {
  providers: RetelProvider[];
}

export async function POST(request: Request) {
  try {
    // 1. Validate API key
    const apiKey = process.env.RETEL_API_KEY;

    if (!apiKey) {
      console.error('❌ ERROR: RETEL_API_KEY is not configured in environment variables.');
      return NextResponse.json(
        {
          success: false,
          error: { message: 'RETEL_API_KEY is not configured on the server' },
        },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body: RetelMatchRequest = await request.json();
    const { category, description, priority, location, ticketId } = body;

    // 3. Validate required fields
    if (!category || !location?.department || !location?.municipality || !ticketId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing required fields: category, location (department, municipality), ticketId' },
        },
        { status: 400 }
      );
    }

    // 4. Call Retel AI API
    const retelResponse = await fetch('https://api.retel.ai/v1/providers/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        category,
        description,
        priority,
        location: {
          department: location.department,
          municipality: location.municipality,
        },
        ticketId,
      }),
    });

    // 5. Handle Retel API errors
    if (!retelResponse.ok) {
      const statusCode = retelResponse.status;
      console.error(`❌ Retel API error: ${statusCode}`);

      // Return 502 for upstream errors
      if (statusCode >= 500) {
        return NextResponse.json(
          {
            success: false,
            error: { message: `Retel AI service unavailable (${statusCode})` },
            providers: [],
          },
          { status: 502 }
        );
      }

      // Return the error status for client errors
      return NextResponse.json(
        {
          success: false,
          error: { message: `Retel API error: ${statusCode}` },
          providers: [],
        },
        { status: statusCode }
      );
    }

    // 6. Parse response
    const retelData: RetelApiResponse = await retelResponse.json();

    console.log(`✅ Retel match successful. Found ${retelData.providers?.length || 0} providers.`);

    return NextResponse.json({
      success: true,
      providers: retelData.providers || [],
    });

  } catch (error: unknown) {
    console.error('❌ Unexpected error in retel-match:', error);
    
    // Handle network errors (Retel API unreachable)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      {
        success: false,
        error: { message: errorMessage },
        providers: [],
      },
      { status: 502 }
    );
  }
}
