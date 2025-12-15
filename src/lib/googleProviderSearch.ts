// Service for searching external providers using Google Custom Search API
// This allows finding service providers based on category and location

import type { 
  GoogleProviderSearchRequest,
  GoogleCustomSearchResponse,
  ExternalProvider 
} from '@/type/googleProvider';

/**
 * Builds a search query for finding service providers in a specific location
 * @param category - Service category (e.g., "Plomería", "Electricidad")
 * @param municipality - City/municipality name
 * @param department - Department/state name
 * @param country - Country name (defaults to "Colombia")
 * @returns Formatted search query string
 */
export function buildProviderSearchQuery(
  category: string,
  municipality: string,
  department: string,
  country: string = 'Colombia'
): string {
  // Build a query that searches for providers in the specific location
  // Example: "plomería en Bogotá Colombia servicios"
  const normalizedCategory = category.toLowerCase().trim();
  const normalizedMunicipality = municipality.trim();
  const normalizedDepartment = department.trim();
  
  return `${normalizedCategory} en ${normalizedMunicipality} ${normalizedDepartment} ${country} servicios profesionales`;
}

/**
 * Searches for external service providers using Google Custom Search API
 * @param request - Search request with category and location
 * @returns Array of external providers found
 */
export async function searchExternalProviders(
  request: GoogleProviderSearchRequest
): Promise<ExternalProvider[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  // Silently return empty array if not configured to avoid log noise
  if (!apiKey || !searchEngineId) {
    return [];
  }

  try {
    const { category, location, description } = request;
    const searchQuery = buildProviderSearchQuery(
      category,
      location.municipality,
      location.department
    );

    // Google Custom Search API endpoint
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('cx', searchEngineId);
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('num', '10'); // Limit results to 10

    console.log(`🔍 Searching Google for: "${searchQuery}"`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Custom Search API error (${response.status}):`, errorText);
      return [];
    }

    const data: GoogleCustomSearchResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('ℹ️ No external providers found via Google search');
      return [];
    }

    // Transform Google search results into provider objects
    const providers: ExternalProvider[] = data.items.map((item) => ({
      name: item.title,
      description: item.snippet || '',
      url: item.link,
      source: 'google' as const,
      location: `${location.municipality}, ${location.department}`,
    }));

    console.log(`✅ Found ${providers.length} external providers via Google`);
    return providers;

  } catch (error) {
    console.error('❌ Error searching external providers:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    return [];
  }
}

/**
 * Validates if Google Custom Search API is properly configured
 * @returns true if API is configured, false otherwise
 */
export function isGoogleSearchConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY &&
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  );
}
