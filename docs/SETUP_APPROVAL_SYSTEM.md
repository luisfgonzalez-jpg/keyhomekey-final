# Setup del Sistema de Aprobación de Tickets

## Introducción

El sistema de aprobación de tickets de KeyHomeKey permite un flujo completo de trabajo desde que un proveedor completa un trabajo hasta que el propietario o inquilino lo aprueba o rechaza.

## Arquitectura del Sistema

### Flujo de Estados

```
Pendiente → Asignado → En progreso → Completado → Resuelto/Rechazado
```

1. **Pendiente**: Ticket recién creado, sin proveedor asignado
2. **Asignado**: Proveedor asignado pero aún no inicia el trabajo
3. **En progreso**: Proveedor trabajando activamente en el ticket
4. **Completado**: Proveedor terminó el trabajo, esperando aprobación
5. **Resuelto**: Propietario/inquilino aprobó el trabajo (estado final exitoso)
6. **Rechazado**: Propietario/inquilino rechazó el trabajo (proveedor debe corregir)

### Auto-aprobación

Si un ticket permanece en estado "Completado" por más de 3 días sin respuesta del propietario/inquilino, se aprueba automáticamente mediante un workflow de GitHub Actions.

## Pasos para Activar en Supabase

### 1. Ejecutar Migraciones SQL

Las migraciones se encuentran en `supabase/migrations/` y deben ejecutarse en orden cronológico:

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar `20260218000000_add_ticket_approval_system.sql`
3. Ejecutar `20260218000001_update_ticket_status_enum.sql`

#### Verificar Migración 1: Tabla de Aprobaciones

```sql
-- Verificar que la tabla existe
SELECT * FROM ticket_approvals LIMIT 1;

-- Verificar columnas de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ticket_approvals';
```

Columnas esperadas:
- `id` (UUID, Primary Key)
- `ticket_id` (UUID, Foreign Key → tickets)
- `approved_by` (UUID, Foreign Key → auth.users)
- `action` (VARCHAR - 'approved' o 'rejected')
- `rating` (INTEGER 1-5, nullable)
- `quality_score` (INTEGER 1-5, nullable)
- `punctuality_score` (INTEGER 1-5, nullable)
- `comment` (TEXT, nullable)
- `evidence_photos` (TEXT[], nullable)
- `created_at` (TIMESTAMPTZ)

#### Verificar Migración 2: Nuevas Columnas en Tickets

```sql
-- Verificar nuevas columnas
SELECT 
  id, 
  status, 
  completed_at, 
  auto_approved, 
  evidence_photos 
FROM tickets 
LIMIT 1;
```

Columnas esperadas en `tickets`:
- `completed_at` (TIMESTAMPTZ) - Timestamp cuando proveedor marca como completado
- `auto_approved` (BOOLEAN) - Flag para tickets auto-aprobados
- `evidence_photos` (TEXT[]) - Array de URLs de fotos de evidencia

#### Verificar RLS Policies

```sql
-- Ver políticas de RLS en ticket_approvals
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ticket_approvals';
```

Políticas esperadas:
1. **Users can view approvals on their tickets** - Permite que usuarios vean aprobaciones de sus tickets
2. **Property owners and tenants can create approvals** - Solo propietarios e inquilinos pueden aprobar/rechazar

### 2. Verificar Estados Disponibles

```sql
-- Verificar que el comentario de la columna status documenta los estados
SELECT obj_description('tickets'::regclass);

-- Ver todos los estados únicos actualmente en uso
SELECT DISTINCT status FROM tickets;
```

Estados válidos:
- Pendiente
- Asignado
- En progreso
- Completado
- Resuelto
- Rechazado

### 3. Verificar Función de Ratings

```sql
-- Probar función de rating (sustituir UUID de prueba)
SELECT * FROM get_provider_rating('00000000-0000-0000-0000-000000000000');
```

Debería retornar:
- `avg_rating` - Calificación promedio
- `total_reviews` - Total de reseñas
- `avg_quality` - Calidad promedio
- `avg_punctuality` - Puntualidad promedio

## Flujo de Trabajo Completo

### Para Propietarios/Inquilinos

1. **Crear Ticket**
   - Ingresar descripción del problema
   - Seleccionar categoría y prioridad
   - Adjuntar fotos (opcional)
   - Estado inicial: "Pendiente"

2. **Asignar Proveedor**
   - Buscar proveedores disponibles
   - Revisar calificaciones y especialidades
   - Asignar proveedor al ticket
   - Estado cambia a: "Asignado"

3. **Esperar Finalización**
   - Proveedor trabaja en el ticket
   - Estado cambia a: "En progreso"
   - Proveedor marca como completado
   - Estado cambia a: "Completado"

4. **Aprobar o Rechazar**
   - Revisar el trabajo realizado
   - **Si aprueba**:
     - Calificar con 1-5 estrellas (obligatorio)
     - Opcionalmente calificar calidad y puntualidad
     - Agregar comentario (opcional)
     - Estado final: "Resuelto"
   - **Si rechaza**:
     - Explicar qué debe corregirse (obligatorio)
     - Estado: "Rechazado"
     - Proveedor debe volver a completar

### Para Proveedores

1. **Recibir Asignación**
   - Notificación de nuevo ticket asignado
   - Revisar detalles y ubicación
   - Estado: "Asignado"

2. **Iniciar Trabajo**
   - Cambiar estado a "En progreso"
   - Actualizar en comentarios cuando sea necesario

3. **Completar Trabajo**
   - Click en "Marcar como Completado"
   - Opcionalmente subir fotos de evidencia
   - Estado cambia a: "Completado"
   - Esperar aprobación del propietario/inquilino

4. **Resultado**
   - **Si aprobado**: Estado "Resuelto" + calificación recibida
   - **Si rechazado**: Estado "Rechazado" + comentarios a corregir
   - **Si no hay respuesta en 3 días**: Auto-aprobado

## Configuración de Auto-aprobación

### GitHub Actions Workflow

El archivo `.github/workflows/auto-approve-tickets.yml` ejecuta automáticamente el script de auto-aprobación.

**Programación**: Cada 6 horas (00:00, 06:00, 12:00, 18:00 UTC)

### Variables de Entorno Requeridas

En GitHub → Settings → Secrets and variables → Actions:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - URL de tu proyecto Supabase
   - Ejemplo: `https://xxxxx.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Service role key de Supabase (Dashboard → Settings → API)
   - **IMPORTANTE**: Mantener seguro, no compartir públicamente

### Ejecutar Manualmente

```bash
# En local (requiere .env con las variables)
node scripts/auto-approve-tickets.js

# En GitHub Actions
# Ir a Actions → Auto-Approve Old Completed Tickets → Run workflow
```

## Testing Manual Completo

### Caso de Prueba 1: Aprobación Exitosa

1. **Preparación**
   ```
   - Login como propietario
   - Crear ticket de prueba
   - Asignar a un proveedor de prueba
   ```

2. **Como Proveedor**
   ```
   - Login con cuenta de proveedor
   - Cambiar ticket a "En progreso"
   - Click "Marcar como Completado"
   - Verificar que cambia a "Completado"
   ```

3. **Como Propietario**
   ```
   - Refrescar página (o esperar actualización en tiempo real)
   - Verificar botones "Aprobar" y "Rechazar" visibles
   - Click "Aprobar Trabajo"
   - Calificar con 5 estrellas
   - Opcionalmente: calidad 5, puntualidad 5
   - Agregar comentario: "Excelente trabajo"
   - Click "Aprobar"
   ```

4. **Verificación**
   ```
   - Estado del ticket: "Resuelto"
   - Timeline muestra evento de aprobación con estrellas
   - En base de datos: registro en ticket_approvals
   ```

### Caso de Prueba 2: Rechazo con Corrección

1. **Como Propietario** (desde ticket "Completado")
   ```
   - Click "Rechazar"
   - Escribir comentario: "Falta pintar la esquina norte"
   - Click "Rechazar"
   ```

2. **Verificación**
   ```
   - Estado: "Rechazado"
   - Timeline muestra evento de rechazo con comentario
   - Proveedor puede ver el comentario
   ```

3. **Corrección del Proveedor**
   ```
   - Login como proveedor
   - Ver comentario de rechazo
   - Hacer correcciones necesarias
   - Marcar nuevamente como "Completado"
   ```

### Caso de Prueba 3: Auto-aprobación

1. **Preparación**
   ```sql
   -- Crear ticket "Completado" con fecha antigua (en Supabase SQL Editor)
   UPDATE tickets 
   SET 
     status = 'Completado',
     completed_at = NOW() - INTERVAL '4 days'
   WHERE id = 'TU_TICKET_ID';
   ```

2. **Ejecutar Script**
   ```bash
   node scripts/auto-approve-tickets.js
   ```

3. **Verificación**
   ```
   - Estado: "Resuelto"
   - auto_approved = true
   - Timeline muestra evento "Auto-aprobado"
   ```

## Verificación de Seguridad

### RLS Policies

```sql
-- Intentar insertar aprobación como proveedor (debería fallar)
-- Login como proveedor en aplicación
-- Intentar hacer POST a /api/tickets/{id}/approve
-- Debería retornar error 403

-- Verificar que solo owner/tenant puede aprobar
-- Login como propietario
-- Aprobar ticket de SU propiedad → ✅ Éxito
-- Intentar aprobar ticket de OTRA propiedad → ❌ Error 403
```

### Validaciones de API

1. **Complete Route**
   - Solo proveedor asignado puede completar ✅
   - Ticket debe estar en "En progreso" ✅
   - Guarda timestamp de completado ✅

2. **Approve Route**
   - Solo owner/tenant puede aprobar ✅
   - Rating obligatorio al aprobar ✅
   - Comentario obligatorio al rechazar ✅
   - Ticket debe estar en "Completado" ✅

## Colores de Estados en UI

Los badges de estado usan los siguientes colores:

```typescript
Pendiente:    Amarillo claro (bg-[#FEF3C7])
Asignado:     Azul claro (bg-[#DBEAFE])
En progreso:  Amarillo/naranja (bg-[#FEF3C7])
Completado:   Púrpura claro (bg-[#DDD6FE])
Resuelto:     Verde claro (bg-[#D1FAE5])
Rechazado:    Rojo claro (bg-[#FEE2E2])
```

## Iconos de Timeline

```typescript
CheckCircle:  Cambios de estado, completado
ThumbsUp:     Aprobaciones
ThumbsDown:   Rechazos
Clock:        Auto-aprobaciones
Star:         Mostrar calificaciones
MessageCircle: Comentarios normales
```

## Troubleshooting

### Error: "No se pudo completar el ticket"

**Causa**: Usuario no es el proveedor asignado o ticket no está en "En progreso"

**Solución**:
```sql
-- Verificar estado del ticket
SELECT id, status, assigned_provider_id FROM tickets WHERE id = 'TICKET_ID';

-- Verificar que user_id del proveedor coincide
SELECT p.id, p.user_id FROM providers p 
WHERE p.id = (SELECT assigned_provider_id FROM tickets WHERE id = 'TICKET_ID');
```

### Error: "Solo el propietario o inquilino puede aprobar"

**Causa**: Usuario autenticado no es owner ni tenant de la propiedad

**Solución**:
```sql
-- Verificar ownership
SELECT t.id, p.owner_id, p.tenant_email, p.tenant_id
FROM tickets t
JOIN properties p ON t.property_id = p.id
WHERE t.id = 'TICKET_ID';
```

### Timeline no muestra eventos

**Causa**: Problema con suscripción en tiempo real o permisos RLS

**Solución**:
1. Verificar que tabla `ticket_comments` tiene RLS habilitado
2. Refrescar página manualmente
3. Revisar console del navegador para errores

### Auto-aprobación no funciona

**Causa**: GitHub Secrets no configurados o script tiene error

**Solución**:
1. Verificar variables en GitHub Secrets
2. Revisar logs en GitHub Actions
3. Ejecutar script manualmente para ver errores:
   ```bash
   node scripts/auto-approve-tickets.js
   ```

## Mejoras Futuras

### En Desarrollo
- [ ] Subida de fotos de evidencia a Supabase Storage
- [ ] Notificaciones WhatsApp/Email automáticas
- [ ] Dashboard de estadísticas de aprobación

### Propuestas
- [ ] Sistema de badges para proveedores destacados
- [ ] Histórico de calificaciones por proveedor
- [ ] Filtros avanzados por calificación
- [ ] Reportes de proveedores más rápidos/mejor calificados
- [ ] Sistema de bonificaciones por buen desempeño

## Soporte

Para problemas o preguntas:
1. Revisar logs de Supabase
2. Revisar console del navegador (F12)
3. Verificar GitHub Actions logs
4. Consultar documentación de Supabase: https://supabase.com/docs

---

**Versión**: 1.0  
**Última actualización**: Febrero 2026  
**Mantenido por**: KeyHomeKey Development Team
