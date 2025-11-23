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