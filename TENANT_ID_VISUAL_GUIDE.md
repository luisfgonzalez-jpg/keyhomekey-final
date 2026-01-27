# Tenant ID Feature - Visual Guide

## 🎯 Feature Overview

This feature allows property owners to link their properties to authenticated tenant users, enabling tenants to log in and access their properties directly through the application.

---

## 📋 Property Registration Form - Enhanced UI

### Before (Original)
```
┌─────────────────────────────────────────────────┐
│ ¿El inmueble está arrendado?          [Toggle]  │
├─────────────────────────────────────────────────┤
│ Nombre del inquilino:    [____________]          │
│ Teléfono del inquilino:  [____________]          │
│ Fecha inicio contrato:   [____________]          │
│ Fecha fin contrato:      [____________]          │
└─────────────────────────────────────────────────┘
```

### After (Enhanced)
```
┌────────────────────────────────────────────────────────────┐
│ ¿El inmueble está arrendado?              [Toggle ON/OFF]  │
├────────────────────────────────────────────────────────────┤
│ Método de asignación de inquilino                          │
│ ┌──────────────────────┐ ┌───────────────────────────┐   │
│ │ Ingresar datos       │ │ Seleccionar inquilino     │   │
│ │ manualmente [ACTIVE] │ │ registrado                │   │
│ └──────────────────────┘ └───────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│ MODE 1: MANUAL ENTRY                                       │
│ Nombre del inquilino:    [____________] ✏️ editable       │
│ Email del inquilino:     [____________] ✏️ editable       │
│ Teléfono del inquilino:  [____________] ✏️ editable       │
│                                                            │
│ MODE 2: SELECT EXISTING (when toggled)                    │
│ Seleccionar inquilino:   [▼ Dropdown]                     │
│   └─> Juan Pérez (juan@example.com)                       │
│   └─> María García (maria@example.com)                    │
│ Nombre del inquilino:    [Juan Pérez] 🔒 read-only       │
│ Email del inquilino:     [juan@...] 🔒 read-only         │
│ Teléfono del inquilino:  [+57...] 🔒 read-only           │
├────────────────────────────────────────────────────────────┤
│ Fecha inicio contrato:   [____________]                    │
│ Fecha fin contrato:      [____________]                    │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Property List View - Status Indicators

```
┌────────────────────────────────────────────────────────────┐
│ Mis propiedades                    [+ Registrar nueva]     │
├────────────────────────────────────────────────────────────┤
│ 🏢 Calle 103 #15-55 • Bogotá, Bogotá D.C.                 │
│ Apartamento · Arrendado                                    │
│ ✅ Inquilino asignado: Juan Pérez (juan@example.com)      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 🏢 Carrera 7 #45-30 • Medellín, Antioquia                │
│ Casa · Arrendado                                           │
│ ⚠️  Sin inquilino asignado (solo datos de contacto)       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 🏢 Avenida 68 #22-10 • Cali, Valle del Cauca             │
│ Local · Disponible                                         │
└────────────────────────────────────────────────────────────┘

Legend:
✅ Green = Tenant linked as authenticated user (tenant_id set)
⚠️  Amber = Legacy tenant (only email/phone, no user link)
```

---

## 🔐 Authorization Flow

### Ticket Edit Permission Check

```
┌─────────────────────────────────────────────────────────┐
│                  Can User Edit Ticket?                   │
└─────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ Is Admin│   │ Is Owner│   │Is Tenant│
    │  Role?  │   │  of Prop│   │  of Prop│
    └────┬────┘   └────┬────┘   └────┬────┘
         │             │              │
         │             │         ┌────▼─────────┐
         │             │         │ CHECK BOTH:  │
         │             │         │ tenant_id =? │
         │             │         │   user.id    │
         │             │         │     OR       │
         │             │         │ tenant_email │
         │             │         │  = user.email│
         │             │         └────┬─────────┘
         │             │              │
         └──────┬──────┴──────────────┘
                │
           ┌────▼────┐
           │ ALLOWED │
           └─────────┘
```

### Property Access for Tenants

```
SCENARIO 1: New Tenant (tenant_id assigned)
┌────────────────────────────────────────────┐
│ User Login: tenant@example.com             │
│ User ID: abc-123                           │
└────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │ Query Props │
        │ WHERE:      │
        │ tenant_id = │
        │  'abc-123'  │
        │     OR      │
        │ tenant_email│
        │ = 'tenant@' │
        └──────┬──────┘
               │
        ┌──────▼──────────────────────┐
        │ ✅ Property 1 (matched by ID)│
        │ ✅ Property 2 (matched by ID)│
        └─────────────────────────────┘

SCENARIO 2: Legacy Tenant (email only)
┌────────────────────────────────────────────┐
│ User Login: oldtenant@example.com          │
│ User ID: xyz-789                           │
└────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │ Query Props │
        │ WHERE:      │
        │ tenant_id = │
        │  'xyz-789'  │  ❌ No match
        │     OR      │
        │ tenant_email│
        │ = 'oldten@' │  ✅ Match!
        └──────┬──────┘
               │
        ┌──────▼──────────────────────────┐
        │ ✅ Property 3 (matched by email) │
        └──────────────────────────────────┘
```

---

## 🗄️ Database Schema Changes

### Properties Table - New Column

```sql
-- BEFORE
CREATE TABLE properties (
  id                UUID PRIMARY KEY,
  owner_id          UUID REFERENCES auth.users(id),
  tenant_name       VARCHAR(255),      -- Text field only
  tenant_email      VARCHAR(255),      -- Text field only  
  tenant_phone      VARCHAR(255),      -- Text field only
  address           TEXT,
  is_rented         BOOLEAN,
  -- ... other columns
);

-- AFTER
CREATE TABLE properties (
  id                UUID PRIMARY KEY,
  owner_id          UUID REFERENCES auth.users(id),
  tenant_id         UUID REFERENCES auth.users(id),  -- 🆕 NEW!
  tenant_name       VARCHAR(255),      -- Kept for display/backward compat
  tenant_email      VARCHAR(255),      -- Kept for backward compat
  tenant_phone      VARCHAR(255),      -- Kept for display
  address           TEXT,
  is_rented         BOOLEAN,
  -- ... other columns
);

-- New Index for Performance
CREATE INDEX idx_properties_tenant_id ON properties(tenant_id);
```

### RLS Policy Update

```sql
-- BEFORE
CREATE POLICY "Users can view their properties"
  ON properties FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- AFTER
CREATE POLICY "Users can view their properties"
  ON properties FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    tenant_id = auth.uid() OR                                    -- 🆕 NEW!
    tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
```

---

## 🔄 Data Flow Diagram

### Creating Property with Registered Tenant

```
┌─────────────┐
│  Owner UI   │
│ (Web Form)  │
└──────┬──────┘
       │ 1. Select "Seleccionar inquilino registrado"
       │ 2. Choose tenant from dropdown
       │ 3. Fields auto-fill
       │ 4. Submit form
       ▼
┌────────────────────────────────────┐
│  handleSubmit()                    │
│  ┌──────────────────────────────┐ │
│  │ payload = {                  │ │
│  │   owner_id: user.id,         │ │
│  │   tenant_id: "abc-123",  🆕  │ │
│  │   tenant_name: "Juan",       │ │
│  │   tenant_email: "juan@..",   │ │
│  │   tenant_phone: "+57..",     │ │
│  │   ...                        │ │
│  │ }                            │ │
│  └──────────────────────────────┘ │
└────────────┬───────────────────────┘
             │
             ▼
    ┌────────────────┐
    │  Supabase DB   │
    │  INSERT INTO   │
    │  properties    │
    └────────┬───────┘
             │
      ┌──────▼──────────────────┐
      │ Property Created:       │
      │ ✅ owner_id = owner     │
      │ ✅ tenant_id = tenant   │
      │ ✅ tenant_name (display)│
      │ ✅ tenant_email (compat)│
      └─────────────────────────┘
```

---

## ✨ User Experience Examples

### Example 1: Owner Creates Property with Registered Tenant

1. **Owner logs in** → Navigates to "Registrar nueva propiedad"
2. **Fills in property details** → Address, type, location
3. **Toggles "¿El inmueble está arrendado?"** → ON
4. **Selects "Seleccionar inquilino registrado"**
5. **Dropdown shows**: 
   - Juan Pérez (juan@example.com) 
   - María García (maria@example.com)
6. **Selects Juan Pérez** → Fields auto-fill:
   - Nombre: Juan Pérez 🔒
   - Email: juan@example.com 🔒
   - Teléfono: +57123456789 🔒
7. **Fills contract dates** → Start: 2024-01-01, End: 2025-01-01
8. **Clicks "Guardar propiedad"** → Success! ✅

**Result**: 
- Property created with `tenant_id = Juan's user ID`
- Juan can now log in and see this property
- Juan can create tickets for this property

### Example 2: Owner Creates Property with Manual Entry

1. **Owner logs in** → Navigates to "Registrar nueva propiedad"
2. **Fills in property details** → Address, type, location
3. **Toggles "¿El inmueble está arrendado?"** → ON
4. **Keeps "Ingresar datos manualmente"** (default)
5. **Manually enters**:
   - Nombre: Pedro López ✏️
   - Email: pedro@example.com ✏️
   - Teléfono: +57987654321 ✏️
6. **Fills contract dates** → Start: 2024-01-01, End: 2025-01-01
7. **Clicks "Guardar propiedad"** → Success! ✅

**Result**:
- Property created with `tenant_id = NULL`
- Tenant data stored as text only
- If Pedro registers later with same email, he'll still have access (via email match)

### Example 3: Tenant Views Their Properties

**Tenant logs in** (Juan from Example 1):
```
┌────────────────────────────────────────────┐
│ Dashboard - Mis propiedades                │
├────────────────────────────────────────────┤
│ ✅ You are assigned to:                    │
│                                            │
│ 🏢 Calle 103 #15-55                       │
│    Bogotá, Bogotá D.C.                    │
│    Apartamento · Arrendado                │
│    [Ver detalles] [Crear ticket]          │
└────────────────────────────────────────────┘
```

---

## 🛡️ Security & Backward Compatibility

### Security Features

✅ **Foreign Key Constraint**: `tenant_id` must reference valid user in `auth.users`
✅ **RLS Policies**: Enforced at database level
✅ **API Authorization**: Multiple layers of permission checks
✅ **No Orphaned Data**: If tenant deleted, property retains data but loses active link

### Backward Compatibility Matrix

| Scenario | tenant_id | tenant_email | Works? | Method |
|----------|-----------|--------------|--------|--------|
| New: Registered tenant | ✅ Set | ✅ Set | ✅ Yes | ID match |
| New: Manual entry | ❌ NULL | ✅ Set | ✅ Yes | Email match |
| Legacy: Email only | ❌ NULL | ✅ Set | ✅ Yes | Email match |
| Future: Migrate legacy | ✅ Set | ✅ Set | ✅ Yes | Both work |

---

## 📈 Benefits

### For Property Owners
- ✅ Can link properties to authenticated tenants
- ✅ Better tenant management
- ✅ Automatic tenant info population
- ✅ Track which tenants are registered users

### For Tenants
- ✅ Can log in with own account
- ✅ See all assigned properties
- ✅ Create and manage tickets
- ✅ Direct access without owner intermediary

### For System
- ✅ Stronger data relationships
- ✅ Better access control
- ✅ Audit trail of user actions
- ✅ Foundation for future features

---

## 🔮 Future Enhancements

1. **Edit Property**: Allow owners to change tenant assignments
2. **Tenant Invitations**: Email invites to unregistered tenants
3. **Bulk Operations**: Assign multiple properties to one tenant
4. **Migration Tool**: Convert email-only tenants to ID-linked
5. **Tenant Dashboard**: Enhanced features for tenant-specific views
6. **Notifications**: Alert when tenant account created for their email

---

## 📝 Testing Checklist

- [ ] Create property with registered tenant
- [ ] Create property with manual tenant data
- [ ] View property list with both types
- [ ] Tenant with `tenant_id` can view property
- [ ] Tenant with `tenant_id` can create ticket
- [ ] Tenant with `tenant_id` can edit ticket
- [ ] Legacy tenant (email only) still works
- [ ] Owner can edit all tickets
- [ ] Unauthorized user cannot edit tickets
- [ ] RLS policies enforced correctly

---

*This feature maintains 100% backward compatibility while adding powerful new user-linking capabilities.*
