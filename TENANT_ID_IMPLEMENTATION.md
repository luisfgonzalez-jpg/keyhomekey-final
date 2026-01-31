# Tenant ID Implementation Summary

## Overview
This implementation adds the ability to link properties to authenticated tenant users via a new `tenant_id` column, while maintaining backward compatibility with the existing email-based tenant identification system.

## Changes Made

### 1. Database Migration (`supabase/migrations/20260127000000_add_tenant_id_to_properties.sql`)
- Added `tenant_id UUID` column to `properties` table with foreign key reference to `auth.users(id)`
- Created index `idx_properties_tenant_id` for query performance
- Updated RLS policy "Users can view their properties" to check:
  - `owner_id = auth.uid()` (owner access)
  - `tenant_id = auth.uid()` (tenant access by ID - NEW)
  - `tenant_email = user.email` (tenant access by email - backward compatibility)

### 2. Property Registration Form (`src/app/owner/properties/new/page.tsx`)

#### New Features:
- **Tenant Selection Mode Toggle**: Owner can choose between:
  - "Ingresar datos manualmente" (Manual entry)
  - "Seleccionar inquilino registrado" (Select existing tenant)
  
- **Tenant Dropdown**: When "existing" mode selected:
  - Queries `users_profiles` table for users with `role='TENANT'`
  - Displays tenant list with name and email
  - Auto-fills name, email, and phone when tenant selected
  - Disables fields to prevent editing

- **Enhanced Form Fields**:
  - Added `tenantEmail` field (was missing in original implementation)
  - Includes `tenant_id` in payload when tenant selected from dropdown
  - Maintains all existing tenant text fields for backward compatibility

#### Data Flow:
```typescript
// Manual mode
tenant_id: null
tenant_name: "Manual Input"
tenant_email: "manual@example.com"
tenant_phone: "1234567890"

// Existing tenant mode
tenant_id: "uuid-of-selected-user"
tenant_name: "John Doe" (auto-filled)
tenant_email: "john@example.com" (auto-filled)
tenant_phone: "+57123456789" (auto-filled)
```

### 3. Property List View (`src/app/owner/properties/page.tsx`)

#### Display Logic:
- Non-rented properties: "Disponible"
- Rented with `tenant_id`: "Inquilino asignado: [name]" (green text)
- Rented without `tenant_id`: "Sin inquilino asignado (solo datos de contacto)" (amber text)

#### Query Update:
Added tenant_id, tenant_name, and tenant_email to SELECT query.

### 4. Ticket Permissions (`src/app/api/tickets/[id]/route.ts`)

#### Authorization Update:
```typescript
// Old logic
const isTenant = property.tenant_email === user.email;

// New logic (backward compatible)
const isTenantById = property.tenant_id === user.id;
const isTenantByEmail = property.tenant_email === user.email;
const isTenant = isTenantById || isTenantByEmail;
```

Users can edit tickets if they are:
- Property owner (`owner_id === user.id`)
- Assigned tenant (`tenant_id === user.id`) - NEW
- Legacy tenant (`tenant_email === user.email`) - backward compatibility
- Admin (`role === 'ADMIN'`)

### 5. Ticket Creation/Viewing (`src/app/page.tsx`)

#### Property Queries for Tenants:
```typescript
// Old query
.eq('tenant_email', user.email)

// New query (backward compatible)
.or(`tenant_id.eq.${user.id},tenant_email.eq.${user.email}`)
```

#### Role Detection:
Updated to check for tenant status using both tenant_id and tenant_email.

#### Ticket Edit Permission Check:
Added check for `tenant_id` alongside existing `tenant_email` check.

## Backward Compatibility

### Maintained Behaviors:
1. **Existing Properties**: Properties with only `tenant_email` (no `tenant_id`) continue to work
2. **Email-Based Access**: Tenants can still access properties via email matching
3. **Ticket Permissions**: Both ID-based and email-based checks work
4. **Data Preservation**: All existing tenant text fields retained

### Migration Path:
1. Existing properties remain functional with `tenant_id = NULL`
2. New properties can use either manual entry or tenant selection
3. Owners can later update properties to assign registered tenants (future feature)

## Security Considerations

### Access Control:
- ✅ Tenant ID must reference valid user in `auth.users`
- ✅ RLS policies enforce both old and new access patterns
- ✅ Tenants cannot access properties of other tenants
- ✅ Ticket permissions properly restrict editing

### Data Validation:
- ✅ Foreign key constraint on `tenant_id`
- ✅ NULL allowed for backward compatibility
- ✅ Manual entry still requires email for notifications

## Testing Recommendations

### Critical Paths:
1. Create property with registered tenant (new flow)
2. Create property with manual tenant data (existing flow)
3. Tenant with `tenant_id` creates and edits ticket
4. Tenant with only email creates and edits ticket (legacy)
5. View properties list with mixed tenant assignment types

### Edge Cases:
1. Tenant user deleted from system (orphaned `tenant_id`)
2. Email mismatch between `tenant_email` and selected user's email
3. Multiple properties assigned to same tenant
4. Property without tenant trying to create tickets

## Future Enhancements

### Potential Improvements:
1. **Edit Property**: Add ability to change tenant assignment
2. **Tenant Search**: Add search/filter in tenant dropdown
3. **Tenant Invitations**: Invite non-registered tenants via email
4. **Bulk Assignment**: Assign tenants to multiple properties at once
5. **Tenant Dashboard**: Enhanced view for tenant-specific features
6. **Data Migration Tool**: Migrate existing tenant_email entries to tenant_id

### Cleanup Opportunities:
1. Eventually deprecate email-only tenant identification
2. Add warning for properties without tenant_id assignment
3. Provide migration wizard for owners to link existing tenants

## Files Modified

1. `supabase/migrations/20260127000000_add_tenant_id_to_properties.sql` (NEW)
2. `src/app/owner/properties/new/page.tsx` (MODIFIED)
3. `src/app/owner/properties/page.tsx` (MODIFIED)
4. `src/app/api/tickets/[id]/route.ts` (MODIFIED)
5. `src/app/page.tsx` (MODIFIED)

## Database Schema

### Properties Table (Updated)
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES auth.users(id),  -- NEW
  tenant_name VARCHAR(255),
  tenant_email VARCHAR(255),
  tenant_phone VARCHAR(255),
  address TEXT,
  property_type VARCHAR(100),
  department VARCHAR(100),
  city VARCHAR(100),
  owner_phone VARCHAR(255),
  is_rented BOOLEAN,
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMP
);
```

### Index
```sql
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
```

## Deployment Steps

1. Apply database migration:
   ```bash
   # Run migration in Supabase
   psql -f supabase/migrations/20260127000000_add_tenant_id_to_properties.sql
   ```

2. Deploy application code:
   ```bash
   npm run build
   npm run start
   ```

3. Verify:
   - Check properties table has `tenant_id` column
   - Test property registration with both modes
   - Test ticket permissions with different user types
   - Verify backward compatibility with existing data

## Support

### Common Issues:

**Q: Can I assign a tenant who isn't registered?**
A: Yes, use "Ingresar datos manualmente" mode. The tenant_id will be NULL until they register.

**Q: What happens if a tenant user is deleted?**
A: The property will retain the tenant_id but it will be orphaned. Consider adding a cleanup job or cascade delete logic.

**Q: How do I migrate existing properties to use tenant_id?**
A: Future enhancement planned. For now, existing properties work fine with email-based identification.

**Q: Can a tenant be assigned to multiple properties?**
A: Yes, the same tenant_id can be used for multiple properties.

## Conclusion

This implementation provides a robust foundation for linking tenants to properties as authenticated users, while maintaining complete backward compatibility with the existing email-based system. The dual-check approach (ID and email) ensures a smooth transition period and prevents breaking existing functionality.
