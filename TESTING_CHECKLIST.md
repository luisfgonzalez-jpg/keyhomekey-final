# Admin Panel Testing Checklist

## Pre-Testing Setup

- [ ] Ensure Supabase instance is running
- [ ] Have at least one user with `ADMIN` role in profiles table
- [ ] Have test data: tickets, properties, providers
- [ ] Configure `.env.local` with valid Supabase credentials

## Authentication & Authorization Tests

### Admin Access
- [ ] Navigate to `/admin` while not logged in → should redirect to `/`
- [ ] Login with non-admin user → should redirect to `/` with alert
- [ ] Login with admin user → should show dashboard
- [ ] Logout from admin panel → should redirect to `/`

### Route Protection
- [ ] Try accessing `/admin/tickets` without auth → redirect
- [ ] Try accessing `/admin/providers` without auth → redirect
- [ ] Try accessing `/admin/tickets/[id]` without auth → redirect

## Dashboard Tests (`/admin`)

### Metrics Display
- [ ] Total tickets count displays correctly
- [ ] Pending tickets count matches database
- [ ] In-progress tickets count matches database
- [ ] Completed tickets count matches database
- [ ] Active providers count matches database

### Charts
- [ ] Pie chart shows tickets by status with correct percentages
- [ ] Bar chart shows tickets by category with correct counts
- [ ] Bar chart shows tickets by priority with correct counts
- [ ] Charts are responsive on mobile
- [ ] Hover tooltips work on charts

### Navigation
- [ ] "Gestionar Tickets" button navigates to `/admin/tickets`
- [ ] "Gestionar Proveedores" button navigates to `/admin/providers`

### Sidebar
- [ ] Dashboard link is highlighted when on `/admin`
- [ ] Tickets link works
- [ ] Proveedores link works
- [ ] Volver al inicio link goes to `/`
- [ ] Cerrar sesión logs out and redirects

### Mobile Responsiveness
- [ ] Sidebar collapses on mobile
- [ ] Hamburger menu opens sidebar
- [ ] Clicking outside closes sidebar
- [ ] All charts display correctly on mobile

## Tickets Management Tests (`/admin/tickets`)

### Tickets List
- [ ] All tickets display in table
- [ ] ID shows first 8 characters + ellipsis
- [ ] Category displays correctly
- [ ] Property address shows full information
- [ ] Status badge has correct color (Pendiente=yellow, En proceso=blue, Completado=green)
- [ ] Priority badge has correct color (Alta=red, Media=orange, Baja=gray)
- [ ] Reporter name and email display
- [ ] Assigned provider shows or "No asignado"
- [ ] Creation date formatted correctly
- [ ] "Ver detalle" button navigates to detail page

### Filters
- [ ] Status filter: "Todos" shows all tickets
- [ ] Status filter: "Pendiente" shows only pending
- [ ] Status filter: "En proceso" shows only in progress
- [ ] Status filter: "Completado" shows only completed
- [ ] Category filter: "Todos" shows all categories
- [ ] Category filter: Specific category shows only that category
- [ ] Priority filter: "Todos" shows all priorities
- [ ] Priority filter: Specific priority shows only that priority
- [ ] Search by ticket ID finds correct ticket
- [ ] Search by property address finds tickets
- [ ] Search by reporter name finds tickets
- [ ] Multiple filters work together
- [ ] "Limpiar filtros" button resets all filters
- [ ] Results counter updates with filters

### Ticket Detail (`/admin/tickets/[id]`)
- [ ] Ticket information displays completely
- [ ] Category shown correctly
- [ ] Description shows full text
- [ ] Status badge displays with correct color
- [ ] Priority badge displays with correct color
- [ ] Creation and update dates formatted correctly
- [ ] Property card shows address and location
- [ ] Property type displays
- [ ] Reporter card shows name and email
- [ ] Provider card shows assigned provider or "Sin proveedor asignado"
- [ ] Media attachments display if present
- [ ] Clicking media opens in new tab
- [ ] Timeline loads with comments
- [ ] Back button returns to tickets list

### Status Editing
- [ ] "Editar Estado" button shows edit form
- [ ] Dropdown has all status options
- [ ] "Cancelar" hides edit form
- [ ] "Guardar" updates status in database
- [ ] Success message shows after save
- [ ] Page reloads with new status
- [ ] Status badge updates after save

## Providers Management Tests (`/admin/providers`)

### Providers List
- [ ] All providers display in table
- [ ] Provider name and email from profile
- [ ] Phone number displays with icon
- [ ] Specialty displays with icon
- [ ] Location shows municipality and department
- [ ] Active/Inactive badge correct
- [ ] Edit icon clickable
- [ ] Delete icon clickable

### Create Provider
- [ ] "Agregar Proveedor" opens form
- [ ] User dropdown shows only PROVIDER role users
- [ ] Phone field accepts input
- [ ] Specialty dropdown has all 14 specialties:
  - [ ] Plomería
  - [ ] Eléctrico
  - [ ] Carpintería
  - [ ] Pintura
  - [ ] Cerrajería
  - [ ] Jardinería
  - [ ] Limpieza
  - [ ] Aire Acondicionado
  - [ ] Gas
  - [ ] Albañilería
  - [ ] Herrería
  - [ ] Vidriería
  - [ ] Electrodomésticos
  - [ ] Otros
- [ ] Department dropdown shows Colombian departments
- [ ] Municipality dropdown updates when department changes
- [ ] Municipality dropdown disabled until department selected
- [ ] Active checkbox toggles
- [ ] "Cancelar" closes form
- [ ] "Guardar" creates provider in database
- [ ] Success message shows
- [ ] List refreshes with new provider
- [ ] Form validation: all required fields checked

### Edit Provider
- [ ] Clicking edit icon opens form
- [ ] Form pre-filled with existing data
- [ ] Can change user selection
- [ ] Can change phone
- [ ] Can change specialty
- [ ] Can change department
- [ ] Can change municipality
- [ ] Can toggle active status
- [ ] "Cancelar" closes form and resets
- [ ] "Actualizar" saves changes
- [ ] Success message shows
- [ ] List refreshes with updates

### Delete Provider (Soft Delete)
- [ ] Clicking delete icon shows confirmation
- [ ] "Cancelar" in confirm closes without delete
- [ ] "OK" in confirm deactivates provider
- [ ] Provider is_active set to false in database
- [ ] Success message shows
- [ ] List refreshes
- [ ] Inactive providers still visible in list

## Performance Tests

- [ ] Dashboard loads within 2 seconds with 100 tickets
- [ ] Tickets list loads within 3 seconds with 100 tickets
- [ ] Filters apply within 500ms
- [ ] Ticket detail loads within 2 seconds
- [ ] Provider list loads within 2 seconds with 50 providers
- [ ] Charts render smoothly without lag

## Cross-Browser Tests

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design works on various screen sizes

## Error Handling Tests

- [ ] Network error during data load shows error state
- [ ] Invalid ticket ID shows "not found" message
- [ ] Database error shows user-friendly message
- [ ] Form submission with missing fields shows validation error
- [ ] Concurrent edits handled gracefully

## Data Integrity Tests

- [ ] Creating provider with existing user ID works
- [ ] Provider specialty constraint prevents invalid values
- [ ] Soft-deleted providers don't appear in ticket assignment
- [ ] Ticket status changes reflect in dashboard immediately
- [ ] Charts update after ticket status changes

## Security Tests

- [ ] SQL injection attempts in search box sanitized
- [ ] XSS attempts in forms properly escaped
- [ ] Admin API endpoints check authentication
- [ ] Row Level Security policies enforced
- [ ] CSRF protection in place

## Accessibility Tests

- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] Screen reader announces page changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels properly associated
- [ ] Error messages announced to screen readers

## Documentation Tests

- [ ] README.md up to date
- [ ] ADMIN_PANEL.md complete and accurate
- [ ] Code comments clear and helpful
- [ ] API documentation matches implementation
- [ ] Migration files documented

## Sign-off

Testing completed by: _______________
Date: _______________
Version: _______________

Critical bugs found: _______________
Minor issues found: _______________
All tests passed: [ ] Yes [ ] No

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
