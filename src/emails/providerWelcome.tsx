import * as React from 'react';

interface ProviderWelcomeEmailProps {
  providerName: string;
  email: string;
  password: string;
  specialty: string;
  loginUrl: string;
}

export default function ProviderWelcomeEmail({
  providerName = 'Proveedor',
  email = 'proveedor@ejemplo.com',
  password = '••••••••••',
  specialty = 'Especialidad',
  loginUrl = 'https://keyhomekey.com/provider',
}: ProviderWelcomeEmailProps) {
  return (
    <html>
      <head />
      <body style={main}>
        <div style={container}>
          <div style={header}>
            <p style={logo}>🔑 KeyHomeKey</p>
          </div>

          <div style={content}>
            <p style={title}>
              ¡Bienvenido/a a KeyHomeKey, {providerName}!
            </p>

            <p style={paragraph}>
              Tu cuenta de proveedor ha sido creada exitosamente. Ahora formas parte de nuestra red de proveedores de servicios.
            </p>

            <div style={credentialsBox}>
              <p style={credentialsTitle}>📧 Tus credenciales de acceso:</p>
              <p style={credentialItem}>
                <strong>Email:</strong> {email}
              </p>
              <p style={credentialItem}>
                <strong>Contraseña temporal:</strong> {password}
              </p>
              <p style={credentialItem}>
                <strong>Especialidad:</strong> {specialty}
              </p>
            </div>

            <p style={warningText}>
              ⚠️ <strong>IMPORTANTE:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.
            </p>

            <div style={buttonContainer}>
              <a style={button} href={loginUrl}>
                Acceder a mi panel de proveedor
              </a>
            </div>

            <hr style={divider} />

            <p style={paragraph}>
              <strong>¿Qué puedes hacer en tu panel de proveedor?</strong>
            </p>

            <p style={listItem}>✅ Ver tickets de servicio asignados a ti</p>
            <p style={listItem}>✅ Aceptar o rechazar trabajos según tu disponibilidad</p>
            <p style={listItem}>✅ Actualizar el estado de los tickets</p>
            <p style={listItem}>✅ Marcar trabajos como completados</p>
            <p style={listItem}>✅ Ver tu historial completo de trabajos</p>

            <hr style={divider} />

            <p style={paragraph}>
              <strong>Instrucciones de acceso:</strong>
            </p>

            <p style={listItem}>1. Haz clic en el botón &quot;Acceder a mi panel&quot;</p>
            <p style={listItem}>2. Ingresa tu email y contraseña temporal</p>
            <p style={listItem}>3. Cambia tu contraseña por una nueva y segura</p>
            <p style={listItem}>4. ¡Listo! Ya puedes gestionar tus tickets</p>

            <hr style={divider} />

            <p style={footerText}>
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
            </p>

            <p style={footerText}>
              Gracias por ser parte de KeyHomeKey 🔑
            </p>

            <p style={footerText}>
              <strong>Equipo KeyHomeKey</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header: React.CSSProperties = {
  padding: '32px 20px',
  textAlign: 'center',
  backgroundColor: '#1e293b',
};

const logo: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: 0,
};

const content: React.CSSProperties = {
  padding: '0 48px',
};

const title: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e293b',
  marginTop: '32px',
  marginBottom: '16px',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#475569',
  marginBottom: '16px',
};

const credentialsBox: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  border: '2px solid #e2e8f0',
};

const credentialsTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1e293b',
  marginBottom: '16px',
  marginTop: 0,
};

const credentialItem: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#334155',
  margin: '8px 0',
  fontFamily: 'monospace',
};

const warningText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  padding: '16px',
  borderRadius: '8px',
  borderLeft: '4px solid #dc2626',
  marginTop: '24px',
  marginBottom: '24px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '32px',
  marginBottom: '32px',
};

const button: React.CSSProperties = {
  backgroundColor: '#1e293b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 32px',
};

const divider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const listItem: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#475569',
  margin: '8px 0',
  paddingLeft: '8px',
};

const footerText: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  textAlign: 'center',
  marginTop: '8px',
};
