// Types for Google Custom Search API integration for external provider search

export interface GoogleProviderSearchRequest {
  category: string;
  location: {
    department: string;
    municipality: string;
  };
  description?: string;
}

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  formattedUrl?: string;
}

export interface GoogleCustomSearchResponse {
  kind: string;
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

export interface ExternalProvider {
  name: string;
  description: string;
  url: string;
  source: 'google';
  location?: string;
}

export interface GoogleProviderSearchResponse {
  success: boolean;
  providers: ExternalProvider[];
  searchQuery?: string;
  error?: {
    message: string;
  };
}
