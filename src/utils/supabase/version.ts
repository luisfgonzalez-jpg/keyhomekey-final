/**
 * Supabase client configuration version
 * Updated: PR #30 - Force rebuild with cookie storage
 */
export const SUPABASE_CONFIG_VERSION = '2.0.0-cookies';
export const BUILD_TIMESTAMP = new Date().toISOString();

// This file forces Next.js to detect changes in the Supabase client module
console.log(`[Supabase Client] Version ${SUPABASE_CONFIG_VERSION} loaded at ${BUILD_TIMESTAMP}`);
