import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. Validate environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey) {
      console.error("❌ ERROR: RESEND_API_KEY not found");
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Email service not configured' } 
      }, { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ ERROR: Supabase configuration missing");
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Authentication service not configured' } 
      }, { status: 500 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Email is required' } 
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 4. Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("❌ Error listing users:", userError);
      // Don't reveal if user exists for security
      return NextResponse.json({ success: true });
    }

    const userExists = userData.users.some(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!userExists) {
      console.log(`ℹ️ User not found: ${normalizedEmail}`);
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // 5. Generate password reset link using Supabase Admin API
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
      }
    });

    if (resetError || !resetData.properties?.action_link) {
      console.error("❌ Error generating reset link:", resetError);
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Failed to generate reset link' } 
      }, { status: 500 });
    }

    const resetLink = resetData.properties.action_link;
    console.log("✅ Reset link generated for:", normalizedEmail);

    // 6. Send email via Resend with professional HTML template
    const resend = new Resend(resendApiKey);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña - KeyHomeKey</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 40px 40px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="font-size: 32px;">🏠</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">KeyHomeKey</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1E293B; font-size: 24px; font-weight: bold;">Recuperación de Contraseña 🔐</h2>
              
              <p style="margin: 0 0 24px; color: #64748B; font-size: 16px; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en KeyHomeKey.
              </p>
              
              <p style="margin: 0 0 32px; color: #64748B; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                      Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                  ⚠️ <strong>Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
                </p>
              </div>
              
              <p style="margin: 0 0 16px; color: #64748B; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
              </p>
              
              <div style="background-color: #F8FAFC; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <p style="margin: 0; color: #475569; font-size: 12px; word-break: break-all; font-family: monospace;">
                  ${resetLink}
                </p>
              </div>
              
              <div style="border-top: 1px solid #E2E8F0; padding-top: 24px; margin-top: 24px;">
                <p style="margin: 0 0 8px; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                  Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                </p>
                <p style="margin: 0; color: #94A3B8; font-size: 13px; line-height: 1.6;">
                  Tu contraseña no cambiará hasta que accedas al enlace de arriba y crees una nueva.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 40px; border-top: 1px solid #E2E8F0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; color: #64748B; font-size: 14px; font-weight: 600;">
                      KeyHomeKey
                    </p>
                    <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                      Gestión inteligente de propiedades
                    </p>
                    <p style="margin: 12px 0 0; color: #CBD5E1; font-size: 11px;">
                      © ${new Date().getFullYear()} KeyHomeKey. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'KeyHomeKey <info@keyhomekey.com>',
      to: [normalizedEmail],
      subject: '🔐 Recuperación de contraseña - KeyHomeKey',
      html: htmlContent,
    });

    if (emailError) {
      console.error("❌ Error sending email via Resend:", emailError);
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Failed to send recovery email' } 
      }, { status: 500 });
    }

    console.log("✅ Password reset email sent successfully:", emailData?.id);
    return NextResponse.json({ 
      success: true,
      message: 'Recovery email sent successfully'
    });

  } catch (error: any) {
    console.error("❌ Unexpected error in password reset:", error);
    return NextResponse.json({ 
      success: false, 
      error: { message: error.message || 'Internal server error' } 
    }, { status: 500 });
  }
}
