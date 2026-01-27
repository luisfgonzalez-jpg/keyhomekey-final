import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inicializamos Resend dentro del handler para asegurar que lea la variable en cada petición
export async function POST(request: Request) {
  try {
    // 1. Leer la API Key fresca
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("❌ ERROR CRÍTICO: No se encontró RESEND_API_KEY en las variables de entorno.");
      // Devolvemos un error con estructura estándar { message: ... }
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Falta la configuración de API Key en el servidor (Revisa .env.local)' } 
      }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { email, name, type } = body;

    // Get site URL from environment or use default
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keyhomekey-final-git-development-keyHomeKey.vercel.app';
    const loginUrl = `${siteUrl}/sign-in`;

    let subject = 'Notificación KeyhomeKey';
    let htmlContent = '<p>Hola</p>';

    if (type === 'invitation') {
      subject = 'Bienvenido a tu nuevo hogar en KeyhomeKey 🏠';
      htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h1>¡Hola ${name}!</h1>
          <p>Tu arrendador te ha invitado a gestionar tu hogar de forma inteligente con <strong>KeyhomeKey</strong>.</p>
          <p>Para comenzar, por favor ingresa al portal:</p>
          <br/>
          <a href="https://keyhomekey.com/registro" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ingresar ahora</a>
        </div>
      `;
    } else if (type === 'tenant-invitation') {
      const propertyData = body.propertyData || {};
      
      subject = `¡Bienvenido a tu nuevo hogar en KeyhomeKey! 🏠`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 20px; }
            .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4F46E5; }
            .property-card { background: #f0f4ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .property-card p { margin: 8px 0; }
            .steps { background: #f9fafb; padding: 20px; border-radius: 6px; }
            .steps ol { padding-left: 20px; }
            .steps li { margin: 10px 0; }
            .cta-button { display: inline-block; background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .highlight { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .benefit-list { list-style: none; padding: 0; }
            .benefit-list li { padding: 10px 0; padding-left: 30px; position: relative; }
            .benefit-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a KeyhomeKey! 🏠</h1>
              <p>Tu plataforma inteligente para gestionar el arriendo</p>
            </div>
            
            <div class="content">
              <p>Hola <strong>${propertyData.tenant_name || 'valued tenant'}</strong>,</p>
              
              <p>Te damos la bienvenida a <strong>KeyhomeKey</strong>, la plataforma que hace el arriendo más fácil, seguro y transparente para todos.</p>
              
              <div class="section">
                <h2 style="margin-top: 0; color: #4F46E5;">Tu Inmueble Asignado</h2>
                <div class="property-card">
                  <p><strong>📍 Dirección:</strong> ${propertyData.address || 'N/A'}</p>
                  <p><strong>🏢 Tipo de Inmueble:</strong> ${propertyData.property_type || 'N/A'}</p>
                  <p><strong>👤 Propietario:</strong> ${propertyData.owner_name || 'N/A'}</p>
                  ${propertyData.owner_phone ? `<p><strong>📞 Contacto Propietario:</strong> ${propertyData.owner_phone}</p>` : ''}
                  ${propertyData.contract_start && propertyData.contract_end ? `<p><strong>📅 Período de Arriendo:</strong> ${propertyData.contract_start} a ${propertyData.contract_end}</p>` : ''}
                  ${propertyData.city && propertyData.department ? `<p><strong>📌 Ubicación:</strong> ${propertyData.city}, ${propertyData.department}</p>` : ''}
                </div>
              </div>
              
              <div class="section">
                <h2 style="margin-top: 0; color: #4F46E5;">¿Qué es KeyhomeKey?</h2>
                <p>KeyhomeKey es la plataforma inteligente que conecta a propietarios e inquilinos para hacer el arriendo más fácil:</p>
                <ul class="benefit-list">
                  <li><strong>Reporta Mantenimiento:</strong> Crea tickets con fotos en segundos sin burocracia</li>
                  <li><strong>Seguimiento en Tiempo Real:</strong> Ve el estado de tus solicitudes en todo momento</li>
                  <li><strong>Comunicación Directa:</strong> Habla con tu propietario y proveedores en un solo lugar</li>
                  <li><strong>Proveedores Verificados:</strong> Acceso a profesionales cualificados para reparaciones</li>
                  <li><strong>Seguridad y Transparencia:</strong> Historial completo de todas las transacciones</li>
                  <li><strong>Disponible 24/7:</strong> Gestiona todo desde tu teléfono o computador</li>
                </ul>
              </div>
              
              <div class="section">
                <h2 style="margin-top: 0; color: #4F46E5;">Primeros Pasos</h2>
                <div class="steps">
                  <ol>
                    <li><strong>Accede a tu Portal:</strong> Click en el botón abajo</li>
                    <li><strong>Verifica tu Email:</strong> Usa tu correo registrado: <strong>${propertyData.tenant_email || body.email}</strong></li>
                    <li><strong>Ingresa tu Contraseña:</strong> Usa la contraseña que estableciste</li>
                    <li><strong>Explora tu Dashboard:</strong> Verás tu inmueble en "Mis Inmuebles"</li>
                    <li><strong>Crea tu Primer Ticket:</strong> Si algo necesita reparación, reporta con fotos y descripción</li>
                    <li><strong>¡Listo!</strong> Tu propietario y los proveedores recibirán notificación automática</li>
                  </ol>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                  Acceder a mi Portal
                </a>
              </div>
              
              <div class="section">
                <h2 style="margin-top: 0; color: #4F46E5;">¿Cómo Reportar un Problema?</h2>
                <ol>
                  <li>Ve a "Mis Inmuebles" en tu dashboard</li>
                  <li>Selecciona tu propiedad</li>
                  <li>Click en "Crear Ticket"</li>
                  <li>Describe el problema (ej: "Fuga de agua en la cocina")</li>
                  <li>Adjunta fotos claras del problema</li>
                  <li>Selecciona la prioridad (Baja, Media, Alta)</li>
                  <li>¡Envía! Tu propietario será notificado al instante</li>
                </ol>
              </div>
              
              <div class="highlight">
                <p><strong>💡 Consejo Importante:</strong> Guarda este correo. Aquí tienes toda la información de tu inmueble y el enlace de acceso. Si olvidas tu contraseña, podrás recuperarla desde la página de login.</p>
              </div>
              
              <div class="section">
                <h2 style="margin-top: 0; color: #4F46E5;">¿Preguntas o Problemas?</h2>
                <p>Estamos aquí para ayudarte:</p>
                <ul>
                  <li><strong>Email de Soporte:</strong> <a href="mailto:info@keyhomekey.com">info@keyhomekey.com</a></li>
                  <li><strong>Portal de Ayuda:</strong> Accede a tu cuenta y consulta el centro de soporte</li>
                  <li><strong>Contacto Propietario:</strong> ${propertyData.owner_phone || 'Disponible en tu perfil'}</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;">KeyhomeKey - Tu hogar, más inteligente</p>
              <p style="margin: 0;">© 2026 KeyhomeKey. Todos los derechos reservados.</p>
              <p style="margin: 10px 0 0 0; color: #9ca3af;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // 2. Intentar enviar el correo
    const data = await resend.emails.send({
      from: 'KeyhomeKey <info@keyhomekey.com>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    // 3. Manejo de errores de Resend
    if (data.error) {
      console.error("❌ Error devuelto por Resend:", data.error);
      return NextResponse.json({ success: false, error: data.error }, { status: 400 });
    }

    console.log("✅ Correo enviado con éxito ID:", data.data?.id);
    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    console.error("❌ Error inesperado en el servidor:", error);
    // Convertimos cualquier error extraño en un objeto estándar
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ 
      success: false, 
      error: { message: errorMessage } 
    }, { status: 500 });
  }
}