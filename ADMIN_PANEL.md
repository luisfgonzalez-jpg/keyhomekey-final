# Admin Panel - KeyHomeKey

## Overview

Complete administrative panel for managing tickets and service providers in the KeyHomeKey platform.

## Features

### 1. Dashboard (`/admin`)

**Metrics Display:**
- Total tickets count
- Pending tickets count
- In-progress tickets count
- Completed tickets count
- Active providers count

**Data Visualizations:**
- Pie chart: Tickets distribution by status
- Bar chart: Tickets by category
- Bar chart: Tickets by priority

**Quick Actions:**
- Navigate to Tickets Management
- Navigate to Providers Management

### 2. Tickets Management (`/admin/tickets`)

**Tickets List:**
- Comprehensive table showing all system tickets
- Columns: ID, Category, Property Address, Status, Priority, Reporter, Assigned Provider, Creation Date
- Color-coded badges:
  - Status: Pendiente (yellow), En proceso (blue), Completado (green)
  - Priority: Alta (red), Media (orange), Baja (gray)

**Advanced Filters:**
- Status filter (All, Pendiente, En proceso, Completado)
- Category filter (All specialties)
- Priority filter (All, Alta, Media, Baja)
- Search by ID, address, or reporter name
- Clear filters button
- Results counter

**Ticket Detail Page (`/admin/tickets/[id]`):**
- Complete ticket information
- Property details with location
- Reporter information
- Provider assignment status
- Media attachments gallery
- Activity timeline with comments
- Status editing capability
- Back navigation to list

### 3. Providers Management (`/admin/providers`)

**Provider List:**
- Table with provider information
- Columns: Name, Contact, Specialty, Location, Status, Actions
- Active/Inactive status badges
- Edit and Delete (soft delete) actions

**Provider Form:**
- User selection from existing PROVIDER role users
- Phone number (WhatsApp)
- Specialty selection (14 options):
  - Plomería
  - Eléctrico
  - Carpintería
  - Pintura
  - Cerrajería
  - Jardinería
  - Limpieza
  - Aire Acondicionado
  - Gas
  - Albañilería
  - Herrería
  - Vidriería
  - Electrodomésticos
  - Otros
- Department and Municipality (dynamic selection based on Colombian locations)
- Active/Inactive toggle

**Actions:**
- Create new provider
- Edit existing provider
- Soft delete (deactivate) provider

### 4. Admin Layout

**Navigation:**
- Sidebar with icon navigation:
  - 🏠 Dashboard
  - 🎫 Tickets
  - 🔧 Providers
  - 🚪 Return to Home
  - 🚪 Logout

**Responsive Design:**
- Desktop: Persistent sidebar
- Mobile: Collapsible hamburger menu
- Full width content area
- Smooth transitions

## Security

**Access Control:**
- All `/admin/*` routes protected by role-based authentication
- Only users with `role = 'ADMIN'` in profiles table can access
- Automatic redirect to home if not authenticated or not admin
- Session validation on component mount

**Implementation:**
```typescript
// Layout checks admin role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'ADMIN') {
  router.push('/');
  return;
}
```

## Technical Stack

- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Database:** Supabase with Row Level Security
- **Authentication:** Supabase Auth

## File Structure

```
src/app/admin/
├── layout.tsx                      # Admin layout with sidebar
├── page.tsx                        # Dashboard with metrics
├── tickets/
│   ├── page.tsx                    # Tickets list
│   └── [id]/
│       └── page.tsx                # Ticket detail
└── providers/
    └── page.tsx                    # Providers management

supabase/migrations/
└── 20260205000000_update_provider_specialties.sql  # Specialty constraint update
```

## Usage

### Accessing the Admin Panel

1. Log in with an account that has `ADMIN` role
2. Navigate to `/admin`
3. Dashboard will load with current statistics

### Managing Tickets

1. Click "Gestionar Tickets" or navigate to `/admin/tickets`
2. Use filters to find specific tickets
3. Click "Ver detalle" to see full ticket information
4. Edit status directly from detail page

### Managing Providers

1. Click "Gestionar Proveedores" or navigate to `/admin/providers`
2. Click "Agregar Proveedor" to create new provider
3. Fill form with required information
4. Use edit icon to modify existing provider
5. Use delete icon to deactivate provider (soft delete)

## Database Schema

### Providers Table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to auth.users)
- phone (TEXT, WhatsApp number)
- specialty (TEXT, with constraint for valid specialties)
- department (TEXT, Colombian department)
- municipality (TEXT, Colombian municipality)
- is_active (BOOLEAN, soft delete flag)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tickets Table
```sql
- id (UUID, primary key)
- property_id (UUID, foreign key to properties)
- category (TEXT, service category)
- description (TEXT, issue description)
- status (TEXT: Pendiente, En proceso, Completado)
- priority (TEXT: Alta, Media, Baja)
- reporter (TEXT, name of person reporting)
- reported_by_email (TEXT, optional)
- assigned_provider_id (UUID, foreign key to providers)
- assigned_provider_name (TEXT, cached name)
- media_urls (ARRAY, attachment URLs)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## API Endpoints

The admin panel uses client-side Supabase queries for data fetching:

- `supabase.from('tickets').select()` - List all tickets
- `supabase.from('providers').select()` - List all providers
- `supabase.from('profiles').select()` - Get user profiles
- `supabase.from('tickets').update()` - Update ticket status

## Future Enhancements

Potential improvements:
- [ ] API routes for server-side data fetching (`/api/admin/stats`, `/api/admin/tickets`)
- [ ] Bulk actions for tickets
- [ ] Export functionality (CSV, PDF)
- [ ] Provider performance analytics
- [ ] Ticket assignment automation
- [ ] Email notifications for status changes
- [ ] Advanced reporting and analytics
- [ ] Audit log for admin actions
- [ ] User management (create/edit users)
- [ ] System settings configuration

## Troubleshooting

**Issue: Build fails with Supabase error**
- Solution: Create `.env.local` with placeholder Supabase credentials for build:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
  ```

**Issue: 404 on admin routes**
- Check that user has ADMIN role in profiles table
- Verify Supabase connection is configured
- Check browser console for authentication errors

**Issue: Charts not displaying**
- Verify Recharts is installed (`npm list recharts`)
- Check that data is loading correctly in browser console
- Ensure tickets exist in database

## Contributing

When making changes to the admin panel:
1. Maintain consistent styling with existing pages
2. Add TypeScript types for all data structures
3. Include loading states for async operations
4. Test on both desktop and mobile
5. Verify role-based access control works
6. Update this documentation

## License

Copyright © 2024 KeyHomeKey. All rights reserved.
