/**
 * Supabase client configuration version
 * Updated: PR #30 - Force rebuild with cookie storage
 */
export const SUPABASE_CONFIG_VERSION = '2.0.0-cookies';

// Build timestamp is generated at module evaluation time to help track deployments
// Note: This will be constant within a single build/deployment
export const BUILD_TIMESTAMP = new Date().toISOString();

// Log version in development to verify correct module is loaded
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(`[Supabase Client] Version ${SUPABASE_CONFIG_VERSION} loaded at ${BUILD_TIMESTAMP}`);
}

