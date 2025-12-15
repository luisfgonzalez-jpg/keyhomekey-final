// API endpoint for searching external providers using Google Custom Search
// POST /api/providers/google-search

import { NextResponse } from 'next/server';
import { searchExternalProviders, isGoogleSearchConfigured } from '@/lib/googleProviderSearch';
import type { 
  GoogleProviderSearchRequest,
  GoogleProviderSearchResponse 
} from '@/type/googleProvider';

export async function POST(request: Request) {
  try {
    // Check if Google Custom Search is configured
    if (!isGoogleSearchConfigured()) {
      return NextResponse.json(
        {
          success: false,
          providers: [],
          error: { 
            message: 'Google Custom Search API is not configured. Please set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variables.' 
          },
        } as GoogleProviderSearchResponse,
        { status: 503 }
      );
    }

    // Parse request body
    const body: GoogleProviderSearchRequest = await request.json();
    const { category, location, description } = body;

    // Validate required fields
    if (!category || !location?.department || !location?.municipality) {
      return NextResponse.json(
        {
          success: false,
          providers: [],
          error: { 
            message: 'Missing required fields: category, location (department, municipality)' 
          },
        } as GoogleProviderSearchResponse,
        { status: 400 }
      );
    }

    // Search for external providers
    const providers = await searchExternalProviders({
      category,
      location,
      description,
    });

    return NextResponse.json({
      success: true,
      providers,
      searchQuery: `${category} en ${location.municipality} ${location.department}`,
    } as GoogleProviderSearchResponse);

  } catch (error: unknown) {
    console.error('❌ Unexpected error in google-search:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      {
        success: false,
        providers: [],
        error: { message: errorMessage },
      } as GoogleProviderSearchResponse,
      { status: 500 }
    );
  }
}
