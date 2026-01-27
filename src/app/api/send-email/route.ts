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
    const { email, name, type, propertyData } = body;

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
      subject = '¡Bienvenido a tu nuevo hogar en KeyhomeKey! 🏠';
      
      const contractStartFormatted = propertyData?.contract_start 
        ? new Date(propertyData.contract_start).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'No especificada';
      const contractEndFormatted = propertyData?.contract_end
        ? new Date(propertyData.contract_end).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'No especificada';

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido a KeyhomeKey! 🏠</h1>
              <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 16px;">Tu plataforma de gestión inmobiliaria</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 20px 0;">¡Hola ${name}!</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Tu propietario te ha dado la bienvenida a <strong>KeyhomeKey</strong>, la plataforma que facilita 
                la comunicación y gestión de mantenimiento de tu nuevo hogar.
              </p>

              <!-- Property Details -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">📍 Detalles de tu Propiedad</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Dirección:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${propertyData?.address || 'No especificada'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Tipo:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${propertyData?.property_type || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Ubicación:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${propertyData?.city || ''}, ${propertyData?.department || ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Propietario:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${propertyData?.owner_name || 'No especificado'}</td>
                  </tr>
                  ${propertyData?.owner_phone ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Teléfono:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${propertyData.owner_phone}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Inicio de contrato:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${contractStartFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Fin de contrato:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${contractEndFormatted}</td>
                  </tr>
                </table>
              </div>

              <!-- What is KeyhomeKey -->
              <div style="margin: 30px 0;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">🔑 ¿Qué es KeyhomeKey?</h3>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                  KeyhomeKey es tu plataforma de gestión inmobiliaria que te permite:
                </p>
                <ul style="color: #475569; font-size: 15px; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                  <li>✅ Ver la información de tu propiedad asignada</li>
                  <li>🔧 Crear tickets de mantenimiento fácilmente</li>
                  <li>💬 Comunicarte directamente con tu propietario y proveedores</li>
                  <li>📱 Gestionar todo desde cualquier dispositivo</li>
                  <li>🌐 Soporte en español</li>
                </ul>
              </div>

              <!-- Instructions -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">🚀 Cómo empezar</h3>
                <ol style="color: #475569; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Haz clic en el botón de abajo para acceder al portal</li>
                  <li>Inicia sesión con tu correo electrónico: <strong>${email}</strong></li>
                  <li>Ve a la sección "Mis inmuebles" para ver tu propiedad asignada</li>
                  <li>Crea tickets de mantenimiento cuando lo necesites</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://keyhomekey-final-git-development-keyHomeKey.vercel.app/sign-in" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  Ingresar a KeyhomeKey →
                </a>
              </div>

              <!-- How to report issues -->
              <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 4px; border-left: 4px solid #f59e0b;">
                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 10px 0;">💡 ¿Cómo reportar problemas de mantenimiento?</h3>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                  Simplemente ingresa a la plataforma, selecciona tu propiedad, y crea un nuevo ticket 
                  describiendo el problema. Puedes adjuntar fotos y el propietario recibirá la notificación 
                  de inmediato. ¡Es así de fácil!
                </p>
              </div>

              <!-- Support -->
              <div style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>¿Necesitas ayuda?</strong><br>
                  Contáctanos en <a href="mailto:info@keyhomekey.com" style="color: #3b82f6; text-decoration: none;">info@keyhomekey.com</a>
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} KeyhomeKey - Plataforma de Gestión Inmobiliaria
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Este correo fue enviado porque tu propietario te asignó una propiedad en KeyhomeKey.
              </p>
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

  } catch (error: any) {
    console.error("❌ Error inesperado en el servidor:", error);
    // Convertimos cualquier error extraño en un objeto estándar
    return NextResponse.json({ 
      success: false, 
      error: { message: error.message || 'Error interno del servidor' } 
    }, { status: 500 });
  }
}