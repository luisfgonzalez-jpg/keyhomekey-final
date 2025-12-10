# Guía de Configuración de WhatsApp Business (Español)

Esta guía te ayudará a configurar la integración de WhatsApp Business para KeyHomeKey.

## ¿Qué incluye esta integración?

La aplicación ya tiene implementadas las siguientes funcionalidades:

✅ **Envío de mensajes automáticos** - Se envían notificaciones a los proveedores cuando se crea un ticket
✅ **Webhook para recibir mensajes** - Tu aplicación puede recibir respuestas de WhatsApp
✅ **Estado de entrega** - Puedes saber si el mensaje fue entregado, leído o falló
✅ **Normalización de números** - Los números de Colombia se formatean automáticamente con el código +57

## Pasos para Activar la Integración

### Paso 1: Crear una Cuenta de Meta Business

1. Ve a [Meta Business](https://business.facebook.com/)
2. Haz clic en "Crear una cuenta"
3. Sigue los pasos para registrar tu negocio

### Paso 2: Crear una Aplicación de Desarrollador

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Meta
3. Haz clic en "Mis aplicaciones" → "Crear aplicación"
4. Selecciona "Negocio" como tipo de aplicación
5. Completa los datos:
   - **Nombre**: "KeyHomeKey Notificaciones"
   - **Email de contacto**: Tu email empresarial
   - **Cuenta empresarial**: Selecciona la que creaste en el Paso 1
6. Haz clic en "Crear aplicación"

### Paso 3: Agregar WhatsApp a tu Aplicación

1. En el panel de tu aplicación, busca "WhatsApp" en la lista de productos
2. Haz clic en "Configurar"
3. Serás redirigido a la página de configuración de WhatsApp

### Paso 4: Obtener tus Credenciales

#### A. Phone Number ID (ID del Número de Teléfono)

1. Ve a **WhatsApp → Configuración de API**
2. Verás un número de teléfono de prueba proporcionado por Meta
3. **Copia el "Phone number ID"** (es un número largo, no el número de teléfono)
4. Este será tu `WHATSAPP_PHONE_NUMBER_ID`

#### B. Access Token (Token de Acceso)

**Para pruebas (24 horas):**
- En la misma página verás un "Token de acceso temporal"
- Puedes usarlo para pruebas

**Para producción (permanente):**
1. Ve a **Configuración del sistema de tu negocio**
2. Haz clic en "Usuarios del sistema"
3. Crea un nuevo usuario del sistema o selecciona uno existente
4. Haz clic en "Generar nuevo token"
5. Selecciona tu aplicación de WhatsApp
6. Marca el permiso `whatsapp_business_messaging`
7. Copia y guarda el token de manera segura
8. Este será tu `WHATSAPP_TOKEN`

### Paso 5: Configurar el Webhook

El webhook permite que tu aplicación reciba mensajes de WhatsApp.

#### A. Crear un Token de Verificación

1. Genera una cadena aleatoria segura:
   ```bash
   openssl rand -base64 32
   ```
2. Copia el resultado
3. Este será tu `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

#### B. Configurar en la Consola de Meta

1. Ve a **WhatsApp → Configuración**
2. En la sección "Webhook", haz clic en "Editar"
3. Ingresa tu URL del webhook:
   ```
   https://tu-dominio.com/api/whatsapp/webhook
   ```
   - Para desarrollo local, usa herramientas como ngrok
   - Para producción, usa tu dominio de Vercel
4. Ingresa el token de verificación que generaste
5. Haz clic en "Verificar y guardar"

#### C. Suscribirse a Eventos

1. Después de verificar, haz clic en "Administrar"
2. Suscríbete a los siguientes campos:
   - ✅ `messages` - Para recibir mensajes entrantes
   - ✅ `message_status` - Para recibir confirmaciones de entrega
3. Haz clic en "Listo"

### Paso 6: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Completa las variables de WhatsApp:
   ```bash
   WHATSAPP_TOKEN=tu-token-permanente-aqui
   WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id-aqui
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu-token-de-verificacion-aqui
   INTERNAL_API_KEY=genera-una-clave-segura-aqui
   ```

3. Para generar `INTERNAL_API_KEY`:
   ```bash
   openssl rand -base64 32
   ```

### Paso 7: Probar la Integración

#### Prueba 1: Enviar un Mensaje

Usa curl o Postman para enviar una prueba:

```bash
curl -X POST http://localhost:3000/api/whatsapp/notify \
  -H "Content-Type: application/json" \
  -d '{
    "to": "573103055424",
    "message": "Prueba desde KeyHomeKey"
  }'
```

Deberías recibir el mensaje en WhatsApp.

#### Prueba 2: Recibir un Mensaje

1. Envía un mensaje de WhatsApp al número de prueba de Meta
2. Revisa los logs de tu aplicación
3. Deberías ver el mensaje registrado en la consola

### Paso 8: Configuración para Producción

#### A. Agregar tu Número de Teléfono

1. Ve a **WhatsApp → Configuración de API**
2. Haz clic en "Agregar número de teléfono"
3. Sigue los pasos para verificar tu número empresarial
4. Actualiza `WHATSAPP_PHONE_NUMBER_ID` con el ID de tu número

#### B. Verificación Empresarial de Meta

Para enviar mensajes a usuarios que no te han contactado primero:
1. Completa la verificación empresarial de Meta
2. Este proceso puede tomar varios días
3. Es obligatorio para uso en producción

#### C. Plantillas de Mensajes

Para mensajes fuera de la ventana de 24 horas:
1. Ve a **WhatsApp → Plantillas de mensajes**
2. Crea plantillas para tus casos de uso
3. Envíalas para aprobación
4. Una vez aprobadas, actualiza tu código para usarlas

### Paso 9: Desplegar en Vercel

1. Configura las variables de entorno en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega todas las variables de WhatsApp

2. Actualiza el webhook en Meta:
   - URL: `https://tu-app.vercel.app/api/whatsapp/webhook`
   - Re-verifica el webhook

## Solución de Problemas

### El webhook no se verifica

- ✅ Verifica que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincida con el de Meta
- ✅ Asegúrate de que tu URL sea accesible públicamente
- ✅ Confirma que tu aplicación esté ejecutándose

### Los mensajes no se envían

- ✅ Verifica que `WHATSAPP_TOKEN` sea válido y no haya expirado
- ✅ Confirma que `WHATSAPP_PHONE_NUMBER_ID` sea correcto
- ✅ Asegúrate de que el número de destino tenga el formato correcto
- ✅ Revisa los logs de la aplicación para ver errores

### No recibo mensajes en el webhook

- ✅ Verifica que el webhook esté configurado y verificado en Meta
- ✅ Confirma que estés suscrito al campo `messages`
- ✅ Busca las solicitudes POST del webhook en tus logs
- ✅ Prueba con la herramienta de prueba de webhooks de Meta

## Límites y Consideraciones

### Límites de Mensajes

- **Sin verificar**: 250 conversaciones por día
- **Número verificado**: 1,000 conversaciones por día
- **Con verificación empresarial**: Se pueden aumentar según la calificación de calidad

### Ventana de Mensajería

- Puedes enviar mensajes **gratuitos** dentro de las 24 horas después de que el usuario te escriba
- Fuera de esta ventana, necesitas usar **plantillas aprobadas** (estas tienen costo)

### Costo

- Mensajes dentro de la ventana de 24 horas: **GRATIS**
- Mensajes con plantillas: Varían según el país (consulta la documentación de Meta)

## Recursos Adicionales

- [Documentación oficial de WhatsApp Business](https://developers.facebook.com/docs/whatsapp)
- [Inicio rápido de Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Guía de configuración de webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Plantillas de mensajes](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)

## Soporte

Si tienes problemas con la configuración:
1. Revisa los logs de la aplicación
2. Verifica la configuración en la Consola de Meta
3. Consulta la sección de troubleshooting en el README.md
4. Contacta al equipo de desarrollo

---

¡La integración de WhatsApp Business está lista! 🎉
