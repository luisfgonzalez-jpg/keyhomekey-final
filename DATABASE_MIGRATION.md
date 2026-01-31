# Database Schema Update Required

## Overview

The external provider search feature stores Google search results in the ticket metadata. This requires adding a new column to the `tickets` table.

## Required Migration

Add the following column to your `tickets` table in Supabase:

```sql
-- Add external_providers column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS external_providers JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN tickets.external_providers IS 'Array of external providers found via Google Custom Search API';
```

## Column Details

- **Name**: `external_providers`
- **Type**: `JSONB`
- **Nullable**: `true` (can be null)
- **Purpose**: Stores array of external provider objects found via Google search
- **Structure**: 
  ```json
  [
    {
      "name": "Provider Name",
      "description": "Provider description from search result",
      "url": "https://provider-website.com",
      "source": "google",
      "location": "City, Department"
    }
  ]
  ```

## How to Apply

### Option 1: Supabase Dashboard (SQL Editor)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the SQL migration above
5. Click **Run** to execute

### Option 2: Supabase CLI

If you're using Supabase CLI and migrations:

```bash
# Create a new migration
supabase migration new add_external_providers_to_tickets

# Add the SQL to the generated migration file in supabase/migrations/
# Then run:
supabase db push
```

### Option 3: Direct Database Access

If you have direct access to your PostgreSQL database:

```bash
psql -U postgres -d your_database_name -c "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS external_providers JSONB;"
```

## Verification

After running the migration, verify the column exists:

```sql
-- Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' AND column_name = 'external_providers';
```

Expected output:
```
 column_name         | data_type | is_nullable
---------------------+-----------+-------------
 external_providers  | jsonb     | YES
```

## Backward Compatibility

The application code handles this gracefully:
- If the column doesn't exist, the update query will fail but won't crash the app
- The ticket creation will still succeed
- External providers will not be stored, but the feature will continue to work via the API endpoint

However, to get the full benefit of the feature, the migration should be applied.

## Testing After Migration

1. Create a test ticket:
   ```bash
   curl -X POST http://localhost:3000/api/tickets \
     -H "Content-Type: application/json" \
     -d '{
       "propertyId": "your-property-id",
       "category": "Plomería",
       "description": "Test ticket",
       "priority": "Alta"
     }'
   ```

2. Query the ticket to verify external_providers was stored:
   ```sql
   SELECT id, category, external_providers
   FROM tickets
   WHERE id = 'ticket-id-from-response'
   LIMIT 1;
   ```

3. Verify the external_providers field contains the Google search results (if Google API is configured)
