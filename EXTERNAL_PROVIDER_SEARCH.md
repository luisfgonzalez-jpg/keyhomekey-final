# External Provider Search - Usage Examples

This document provides examples of how to use the Google Custom Search integration for finding external service providers.

## Overview

When a ticket is created in the KeyHomeKey app, the system will:
1. Search for internal providers in the database (existing functionality)
2. **NEW**: Search for external providers via Google Custom Search API based on the ticket's category and location
3. Store external provider results in the ticket metadata for later reference

## API Endpoints

### 1. Create Ticket (with automatic provider search)

**Endpoint**: `POST /api/tickets`

This endpoint now automatically searches for both internal and external providers.

**Request Example**:
```json
{
  "propertyId": "123e4567-e89b-12d3-a456-426614174000",
  "category": "Plomería",
  "description": "Fuga de agua en la cocina",
  "priority": "Alta",
  "reporter": "Propietario",
  "reported_by_email": "owner@example.com",
  "mediaPaths": []
}
```

**Response Example**:
```json
{
  "success": true,
  "ticket": {
    "id": "ticket-uuid",
    "property_id": "property-uuid",
    "category": "Plomería",
    "description": "Fuga de agua en la cocina",
    "priority": "Alta",
    "status": "Pendiente",
    "external_providers": [
      {
        "name": "Plomería Profesional Bogotá - Servicios de Fontanería",
        "description": "Expertos en reparación de fugas, instalación de tuberías...",
        "url": "https://example.com/plomeria-bogota",
        "source": "google",
        "location": "Bogotá, Cundinamarca"
      }
    ]
  },
  "whatsapp": { /* WhatsApp API response */ },
  "externalProviders": [ /* Array of external providers found */ ],
  "internalProviderFound": true
}
```

### 2. Search External Providers Only

**Endpoint**: `POST /api/providers/google-search`

Use this endpoint to search for external providers without creating a ticket.

**Request Example**:
```json
{
  "category": "Electricidad",
  "location": {
    "department": "Antioquia",
    "municipality": "Medellín"
  },
  "description": "Problemas con el cableado eléctrico"
}
```

**Response Example**:
```json
{
  "success": true,
  "providers": [
    {
      "name": "Electricidad Medellín - Servicios Eléctricos 24/7",
      "description": "Instalaciones eléctricas residenciales y comerciales...",
      "url": "https://example.com/electricidad-medellin",
      "source": "google",
      "location": "Medellín, Antioquia"
    },
    {
      "name": "Electricistas Profesionales Antioquia",
      "description": "Reparación de cortocircuitos, cambio de breakers...",
      "url": "https://example.com/electricistas-antioquia",
      "source": "google",
      "location": "Medellín, Antioquia"
    }
  ],
  "searchQuery": "electricidad en Medellín Antioquia Colombia servicios profesionales"
}
```

## Environment Configuration

To enable external provider search, configure these environment variables:

```bash
# Required for Google Custom Search API
GOOGLE_CUSTOM_SEARCH_API_KEY=your-google-api-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
```

See the main README.md for detailed setup instructions.

## Search Query Format

The system builds search queries in the following format:

```
{category} en {municipality} {department} Colombia servicios profesionales
```

**Examples**:
- `plomería en Bogotá Cundinamarca Colombia servicios profesionales`
- `electricidad en Medellín Antioquia Colombia servicios profesionales`
- `cerrajería en Cali Valle del Cauca Colombia servicios profesionales`

## How It Works

1. **Ticket Creation**: When a ticket is created via `POST /api/tickets`:
   ```
   User creates ticket → Search internal DB → Search Google → Store results → Send WhatsApp
   ```

2. **Provider Matching Flow**:
   ```
   Internal DB Search:
   - Match by: department + municipality + category
   - Use first active provider found
   
   Google Search (always runs):
   - Build query: "{category} en {municipality} {department} Colombia servicios profesionales"
   - Return up to 10 results
   - Store in ticket metadata (external_providers field)
   ```

3. **Fallback Behavior**:
   - If Google API is not configured: Logs warning, continues without external search
   - If Google API fails: Logs error, continues with ticket creation
   - Internal provider search is always attempted first

## Error Handling

### Google API Not Configured
If `GOOGLE_CUSTOM_SEARCH_API_KEY` or `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` are not set:
- System logs: `⚠️ Google Custom Search API not configured. Skipping external provider search.`
- Returns empty array for external providers
- Ticket creation continues normally

### Google API Error
If Google API returns an error:
- System logs: `❌ Google Custom Search API error (status): error details`
- Returns empty array for external providers
- Ticket creation continues normally

### No Results Found
If Google returns no results:
- System logs: `ℹ️ No external providers found via Google search`
- Returns empty array
- Ticket creation continues normally

## Testing

### Test Google Search Endpoint

```bash
# Test external provider search
curl -X POST http://localhost:3000/api/providers/google-search \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Plomería",
    "location": {
      "department": "Cundinamarca",
      "municipality": "Bogotá"
    },
    "description": "Fuga de agua"
  }'
```

### Test Ticket Creation with Provider Search

```bash
# Create a ticket (requires valid propertyId)
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "your-property-uuid",
    "category": "Plomería",
    "description": "Fuga de agua en cocina",
    "priority": "Alta",
    "reporter": "Propietario"
  }'
```

## Limitations

- **Free Tier**: Google Custom Search API offers 100 free queries per day
- **Rate Limits**: After 100 queries, additional queries cost $5 per 1,000 queries
- **Search Scope**: Searches the entire web by default (can be configured to search specific sites)
- **Result Quality**: Results depend on Google's search algorithm and available data

## Future Enhancements

Potential improvements to consider:
1. Cache search results to reduce API calls
2. Add relevance scoring for providers
3. Filter results by specific criteria (e.g., ratings, distance)
4. Integrate with Google Places API for more structured data
5. Add provider contact information extraction
6. Implement automatic provider verification
