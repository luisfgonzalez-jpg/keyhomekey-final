import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const emailTemplates = {
    invitation: `
    <div style='font-family: Arial, sans-serif;'>
        <h1>You're Invited!</h1>
        <p>We are pleased to invite you to our platform. Here are some details:</p>
        <ul>
            <li><strong>Event:</strong> {{event}}</li>
            <li><strong>Date:</strong> {{date}}</li>
            <li><strong>Location:</strong> {{location}}</li>
        </ul>
        <p>Please click <a href='{{link}}'>here</a> to accept the invitation.</p>
    </div>`,

    tenantInvitation: `
    <div style='font-family: Arial, sans-serif;'>
        <h1>Welcome to Your New Home!</h1>
        <p>Dear Tenant,</p>
        <p>We are excited to invite you to join the KeyhomeKey community! Below are the details of your new property:</p>
        <h2>Property Details</h2>
        <ul>
            <li><strong>Property Address:</strong> {{propertyAddress}}</li>
            <li><strong>Owner's Name:</strong> {{ownerName}}</li>
            <li><strong>Contact Number:</strong> {{ownerContact}}</li>
        </ul>
        <h2>Setup Instructions</h2>
        <p>To get started, please follow these instructions:</p>
        <ol>
            <li>Check your email for confirmation.</li>
            <li>Visit our website to complete your profile.</li>
            <li>Contact your property owner if you have any questions.</li>
        </ol>
        <h2>KeyhomeKey Benefits</h2>
        <ul>
            <li>Seamless communication with your landlord.</li>
            <li>Easy access to property management services.</li>
            <li>Exclusive offers and discounts for tenants.</li>
        </ul>
        <p>If you have any questions, feel free to reach out!</p>
        <p>Best Regards,<br/>The KeyhomeKey Team</p>
    </div>`,

    tenantWelcome: `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a KeyHomeKey</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">KeyHomeKey</h1>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px;">¡Bienvenido/a {{tenantName}}!</h2>
                                <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                    Te damos la bienvenida a KeyHomeKey, tu nueva herramienta para gestionar y reportar 
                                    novedades de tu inmueble de manera rápida y eficiente.
                                </p>
                                
                                <!-- What is KeyHomeKey Section -->
                                <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                    <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px;">¿Qué es KeyHomeKey?</h3>
                                    <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                        KeyHomeKey es una plataforma que facilita la comunicación entre propietarios e inquilinos, 
                                        permitiendo reportar y gestionar novedades del inmueble de manera rápida y eficiente.
                                    </p>
                                </div>
                                
                                <!-- Property Details Section -->
                                <div style="margin: 30px 0;">
                                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                                        📋 Datos de tu Propiedad
                                    </h3>
                                    <table width="100%" cellpadding="8" cellspacing="0" border="0" style="font-size: 14px;">
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>📍 Dirección:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{propertyAddress}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>🏠 Tipo:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{propertyType}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>📍 Ciudad:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{city}}, {{department}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>👤 Propietario:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{ownerName}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>📞 Teléfono:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{ownerPhone}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>📅 Inicio de contrato:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{contractStart}}</td>
                                        </tr>
                                        <tr>
                                            <td style="color: #64748b; padding: 8px 0;"><strong>📅 Fin de contrato:</strong></td>
                                            <td style="color: #475569; padding: 8px 0;">{{contractEnd}}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- How It Works Section -->
                                <div style="margin: 30px 0;">
                                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
                                        🔧 ¿Cómo funciona?
                                    </h3>
                                    <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                        <li style="margin-bottom: 8px;">Accede a tu cuenta con el link de abajo</li>
                                        <li style="margin-bottom: 8px;">Reporta cualquier novedad del inmueble (daños, reparaciones, mantenimiento)</li>
                                        <li style="margin-bottom: 8px;">Adjunta fotos y describe el problema</li>
                                        <li style="margin-bottom: 8px;">Nosotros nos encargamos de conectar con el proveedor adecuado</li>
                                        <li style="margin-bottom: 8px;">Recibe actualizaciones en tiempo real</li>
                                    </ol>
                                </div>
                                
                                <!-- Benefits Section -->
                                <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
                                    <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px;">✨ Beneficios para ti</h3>
                                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                        <li style="margin-bottom: 8px;">✓ Reporta novedades 24/7 desde cualquier dispositivo</li>
                                        <li style="margin-bottom: 8px;">✓ Seguimiento en tiempo real de tus solicitudes</li>
                                        <li style="margin-bottom: 8px;">✓ Comunicación directa con tu propietario</li>
                                        <li style="margin-bottom: 8px;">✓ Historial completo de mantenimientos</li>
                                        <li style="margin-bottom: 8px;">✓ Respuesta rápida y eficiente</li>
                                    </ul>
                                </div>
                                
                                <!-- CTA Button -->
                                <div style="margin: 30px 0; text-align: center;">
                                    <a href="{{loginUrl}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                                        Acceder a KeyHomeKey →
                                    </a>
                                </div>
                                
                                <!-- Help Section -->
                                <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">¿Necesitas ayuda?</h3>
                                    <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                                        Si tienes preguntas, contacta a tu propietario:<br>
                                        📞 <strong>{{ownerPhone}}</strong>
                                    </p>
                                </div>
                                
                                <!-- Signature -->
                                <div style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px;">
                                        Saludos,<br>
                                        <strong>El equipo de KeyHomeKey</strong>
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                                    Este correo fue enviado por KeyHomeKey.<br>
                                    Si no esperabas este mensaje, por favor ignóralo.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `,
};

interface SendEmailRequest {
    to: string;
    subject: string;
    template: string;
    variables?: Record<string, string>;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates the request is authorized.
 * Authorization can be via:
 * 1. Same-origin request (for frontend calls within the application)
 */
function isAuthorized(request: Request): boolean {
    // For same-origin requests (frontend calls), check the origin/referer header
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Allow requests where origin or referer matches the host
    if (host) {
        if (origin) {
            try {
                const originUrl = new URL(origin);
                if (originUrl.host === host) {
                    return true;
                }
            } catch {
                // Invalid origin URL, continue to check referer
            }
        }

        if (referer) {
            try {
                const refererUrl = new URL(referer);
                if (refererUrl.host === host) {
                    return true;
                }
            } catch {
                // Invalid referer URL
            }
        }
    }

    return false;
}

/**
 * Replaces variables in a template string
 * Example: "Hello {{name}}" with {name: "John"} => "Hello John"
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`{{${escapedKey}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    
    return result;
}

export async function POST(request: Request) {
    try {
        // 1. Validate authorization (same-origin request)
        if (!isAuthorized(request)) {
            console.error('❌ Unauthorized request to send-email API');
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized' } },
                { status: 401 }
            );
        }

        // 2. Validate Resend API key
        const resendApiKey = process.env.RESEND_API_KEY;
        
        if (!resendApiKey) {
            console.error('❌ RESEND_API_KEY not configured');
            return NextResponse.json(
                { success: false, error: { message: 'Email service not configured' } },
                { status: 500 }
            );
        }

        // NEW: Validate sender email configuration
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'KeyHomeKey <noreply@keyhomekey.com>';

        // Log sender configuration
        if (!process.env.RESEND_FROM_EMAIL) {
            console.warn('⚠️  RESEND_FROM_EMAIL not set, using default: noreply@keyhomekey.com');
        } else {
            console.log('✅ Using configured sender:', process.env.RESEND_FROM_EMAIL);
        }
        
        // 3. Parse and validate request body
        const body: any = await request.json();

        // BACKWARD COMPATIBILITY: Handle legacy format
        // Legacy format: { email: "...", propertyAddress: "..." }
        // New format: { to: "...", subject: "...", template: "...", variables: {...} }

        let to: string;
        let subject: string;
        let template: string;
        let variables: Record<string, string> = {};

        // Check if this is legacy format (has 'email' field instead of 'to')
        if (body.email && !body.to) {
            console.warn('⚠️  Legacy email format detected, auto-converting...');
            
            // Convert legacy format to new format
            to = body.email;
            subject = '¡Bienvenido/a a KeyHomeKey! Tu nueva herramienta de gestión';
            template = 'tenantWelcome';
            
            // Build variables from legacy format
            variables = {
                tenantName: body.tenantName || 'Inquilino',
                propertyAddress: body.propertyAddress || 'Dirección no especificada',
                propertyType: body.propertyType || 'Inmueble',
                city: body.city || 'Ciudad',
                department: body.department || 'Departamento',
                ownerName: body.ownerName || 'Propietario',
                ownerPhone: body.ownerPhone || 'Teléfono no disponible',
                contractStart: body.contractStart || 'No especificado',
                contractEnd: body.contractEnd || 'No especificado',
                loginUrl: body.loginUrl || 'https://keyhomekey.com/sign-in',
            };
            
            console.log('✅ Legacy format converted to new format');
        } else {
            // Use new format
            to = body.to;
            subject = body.subject;
            template = body.template;
            variables = body.variables || {};
        }

        // Log email configuration for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('📧 Email will be sent from:', fromEmail);
            console.log('📧 Email will be sent to:', to);
            console.log('📧 Template:', template);
        }

        // Validate required fields
        if (!to || typeof to !== 'string') {
            console.error('❌ Missing "to" field. Body received:', body);
            return NextResponse.json(
                { success: false, error: { message: 'Missing or invalid "to" field' } },
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(to)) {
            return NextResponse.json(
                { success: false, error: { message: 'Invalid email address format' } },
                { status: 400 }
            );
        }
        
        if (!subject || typeof subject !== 'string') {
            return NextResponse.json(
                { success: false, error: { message: 'Missing or invalid "subject" field' } },
                { status: 400 }
            );
        }
        
        if (!template || typeof template !== 'string') {
            return NextResponse.json(
                { success: false, error: { message: 'Missing or invalid "template" field' } },
                { status: 400 }
            );
        }
        
        // 4. Get template content
        const templateContent = emailTemplates[template as keyof typeof emailTemplates];
        
        if (!templateContent) {
            return NextResponse.json(
                { success: false, error: { message: `Template "${template}" not found` } },
                { status: 400 }
            );
        }
        
        // 5. Replace variables in template
        const emailHtml = replaceVariables(templateContent, variables);
        
        // 6. Initialize Resend and send email
        const resend = new Resend(resendApiKey);

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [to],
            subject: subject,
            html: emailHtml,
        });
        
        if (error) {
            console.error('❌ Resend API error:', error);
            if (process.env.NODE_ENV === 'development') {
                console.error('📧 Attempted from:', fromEmail);
                console.error('📧 Recipient:', to);
            }
            console.error('💡 If you see "Invalid from address", verify your domain at https://resend.com/domains');
            
            return NextResponse.json(
                { success: false, error: { message: error.message || 'Failed to send email' } },
                { status: 500 }
            );
        }
        
        // 7. Success response
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Email sent successfully');
            console.log('📧 Email ID:', data?.id);
            console.log('📧 From:', fromEmail);
            console.log('📧 To:', to);
            console.log('📧 Subject:', subject);
        }
        return NextResponse.json({
            success: true,
            data: {
                emailId: data?.id,
                to: to,
            },
        });
        
    } catch (error: unknown) {
        console.error('❌ Unexpected error in send-email API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { success: false, error: { message: errorMessage } },
            { status: 500 }
        );
    }
}

export default emailTemplates;