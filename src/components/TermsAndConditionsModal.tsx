'use client';

import { Shield, X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
  className?: string;
}) => {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all';
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]',
    outline: 'border-2 border-[#2563EB] text-[#2563EB] bg-white hover:bg-[#DBEAFE]',
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default function TermsAndConditionsModal({ isOpen, onClose }: TermsAndConditionsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DBEAFE] rounded-xl">
              <Shield size={24} className="text-[#2563EB]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E293B]">
              Términos y Condiciones de Uso
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-[#DBEAFE] border-l-4 border-[#2563EB] p-4 rounded-r-lg">
            <p className="text-sm text-[#1E40AF]">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* 1. Aceptación de los términos */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">1</span>
              Aceptación de los Términos
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Al acceder y utilizar KeyHomeKey, usted acepta estar legalmente vinculado por estos Términos y Condiciones. 
                Si no está de acuerdo con alguno de estos términos, por favor no utilice nuestros servicios.
              </p>
              <p>
                KeyHomeKey se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entrarán 
                en vigor inmediatamente después de su publicación en la plataforma.
              </p>
            </div>
          </section>

          {/* 2. Descripción del servicio */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">2</span>
              Descripción del Servicio
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                KeyHomeKey es una plataforma digital que facilita la gestión de inmuebles en Colombia, conectando:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Propietarios:</strong> Registro y administración de propiedades</li>
                <li><strong>Inquilinos:</strong> Reporte de novedades y seguimiento de mantenimiento</li>
                <li><strong>Proveedores:</strong> Gestión de tickets de mantenimiento y reparaciones</li>
              </ul>
              <p>
                La plataforma actúa únicamente como intermediario tecnológico y no es parte de ninguna relación 
                contractual de arrendamiento o prestación de servicios entre usuarios.
              </p>
            </div>
          </section>

          {/* 3. Registro y cuenta de usuario */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">3</span>
              Registro y Cuenta de Usuario
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>Para utilizar KeyHomeKey, usted debe:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ser mayor de 18 años o tener capacidad legal para contratar en Colombia</li>
                <li>Proporcionar información veraz, precisa y actualizada</li>
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              </ul>
              <p>
                Usted es responsable de todas las actividades que ocurran bajo su cuenta. KeyHomeKey se reserva 
                el derecho de suspender o cancelar cuentas que violen estos términos.
              </p>
            </div>
          </section>

          {/* 4. Uso de la plataforma */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">4</span>
              Uso de la Plataforma
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>Al usar KeyHomeKey, usted se compromete a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Utilizar la plataforma solo para fines legales y autorizados</li>
                <li>No interferir con el funcionamiento de la plataforma</li>
                <li>No suplantar la identidad de otras personas</li>
                <li>No cargar contenido malicioso, ofensivo o ilegal</li>
                <li>Respetar los derechos de propiedad intelectual</li>
                <li>No extraer datos mediante técnicas de web scraping o similares</li>
              </ul>
            </div>
          </section>

          {/* 5. Responsabilidades por rol */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">5</span>
              Responsabilidades por Rol de Usuario
            </h3>
            <div className="text-sm text-[#64748B] space-y-3">
              <div>
                <h4 className="font-semibold text-[#1E293B] mb-1">Propietarios:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Registrar información veraz sobre sus inmuebles</li>
                  <li>Mantener actualizada la información de inquilinos y contratos</li>
                  <li>Responder a los tickets en tiempo razonable</li>
                  <li>Cumplir con las obligaciones legales del Código Civil colombiano (Ley 820 de 2003)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1E293B] mb-1">Inquilinos:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reportar fallas o daños de forma oportuna y veraz</li>
                  <li>Permitir el acceso para reparaciones coordinadas</li>
                  <li>Usar la plataforma para comunicación relacionada con el inmueble</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#1E293B] mb-1">Proveedores de Servicios:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Contar con las certificaciones y permisos necesarios para prestar servicios</li>
                  <li>Responder a tickets asignados en tiempo razonable</li>
                  <li>Proporcionar servicios de calidad conforme a estándares profesionales</li>
                  <li>Cumplir con normativas de seguridad y salud ocupacional</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6. Tickets y gestión de mantenimiento */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">6</span>
              Tickets y Gestión de Mantenimiento
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                La plataforma permite crear tickets de mantenimiento que son enviados a proveedores. Sin embargo:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>KeyHomeKey no garantiza la disponibilidad inmediata de proveedores</li>
                <li>La aceptación y ejecución de trabajos es responsabilidad del proveedor</li>
                <li>Los acuerdos comerciales (precio, tiempo, garantías) son entre el propietario y el proveedor</li>
                <li>KeyHomeKey no es responsable de la calidad del servicio prestado</li>
              </ul>
            </div>
          </section>

          {/* 7. Propiedad intelectual */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">7</span>
              Propiedad Intelectual
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Todos los derechos de propiedad intelectual sobre KeyHomeKey, incluyendo pero no limitado a:
                diseño, código fuente, marca, logos y contenido, son propiedad exclusiva de KeyHomeKey.
              </p>
              <p>
                El contenido generado por usuarios (fotos, descripciones, reportes) sigue siendo propiedad 
                del usuario, pero al subirlo a la plataforma, otorga a KeyHomeKey una licencia no exclusiva 
                para usarlo en la prestación del servicio.
              </p>
            </div>
          </section>

          {/* 8. Privacidad y protección de datos */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">8</span>
              Privacidad y Protección de Datos
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                El tratamiento de datos personales se rige por nuestra <strong>Política de Tratamiento de Datos Personales</strong>, 
                en cumplimiento de la Ley 1581 de 2012 y Decreto 1377 de 2013.
              </p>
              <p>
                KeyHomeKey implementa medidas de seguridad técnicas y administrativas para proteger la información,
                pero no puede garantizar seguridad absoluta contra accesos no autorizados.
              </p>
            </div>
          </section>

          {/* 9. Limitación de responsabilidad */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">9</span>
              Limitación de Responsabilidad
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>KeyHomeKey no será responsable de:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Daños causados por proveedores de servicios durante reparaciones</li>
                <li>Incumplimientos de contratos de arrendamiento entre propietarios e inquilinos</li>
                <li>Pérdida de datos por fallas técnicas, aunque se realizan respaldos periódicos</li>
                <li>Interrupciones del servicio por mantenimiento o causas de fuerza mayor</li>
                <li>Contenido falso o engañoso publicado por usuarios</li>
                <li>Decisiones tomadas basándose en la información de la plataforma</li>
              </ul>
              <p className="font-semibold text-[#1E293B]">
                En ningún caso la responsabilidad de KeyHomeKey excederá el monto pagado por el usuario 
                en los últimos 12 meses (si aplica).
              </p>
            </div>
          </section>

          {/* 10. Comunicaciones */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">10</span>
              Comunicaciones
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Al usar KeyHomeKey, usted acepta recibir comunicaciones por:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Correo electrónico</li>
                <li>WhatsApp</li>
                <li>Notificaciones dentro de la plataforma</li>
              </ul>
              <p>
                Estas comunicaciones pueden incluir: confirmaciones de tickets, actualizaciones del servicio,
                recordatorios, y notificaciones relacionadas con su cuenta.
              </p>
            </div>
          </section>

          {/* 11. Terminación del servicio */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">11</span>
              Terminación del Servicio
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Usted puede cancelar su cuenta en cualquier momento. KeyHomeKey puede suspender o cancelar 
                su acceso si:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Viola estos Términos y Condiciones</li>
                <li>Proporciona información falsa</li>
                <li>Usa la plataforma para actividades ilegales o fraudulentas</li>
                <li>No paga los servicios contratados (si aplica en el futuro)</li>
              </ul>
            </div>
          </section>

          {/* 12. Indemnización */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">12</span>
              Indemnización
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Usted acepta indemnizar y mantener indemne a KeyHomeKey, sus directores, empleados y afiliados,
                de cualquier reclamo, pérdida, daño, responsabilidad y gasto (incluyendo honorarios legales)
                derivados de:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Su uso de la plataforma</li>
                <li>Violación de estos términos</li>
                <li>Violación de derechos de terceros</li>
                <li>Contenido que usted publique en la plataforma</li>
              </ul>
            </div>
          </section>

          {/* 13. Ley aplicable y jurisdicción */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">13</span>
              Ley Aplicable y Jurisdicción
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>
                Estos Términos y Condiciones se rigen por las leyes de la República de Colombia.
              </p>
              <p>
                Cualquier controversia derivada de estos términos será sometida a los tribunales competentes 
                de Bogotá D.C., Colombia, renunciando expresamente a cualquier otro fuero que pudiera corresponder.
              </p>
            </div>
          </section>

          {/* 14. Disposiciones generales */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">14</span>
              Disposiciones Generales
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Divisibilidad:</strong> Si alguna disposición de estos términos es declarada inválida,
                  las demás disposiciones permanecerán en pleno vigor.
                </li>
                <li>
                  <strong>Renuncia:</strong> La falta de ejercicio de cualquier derecho no constituye una renuncia al mismo.
                </li>
                <li>
                  <strong>Cesión:</strong> Usted no puede ceder estos términos sin consentimiento escrito de KeyHomeKey.
                </li>
                <li>
                  <strong>Acuerdo completo:</strong> Estos términos constituyen el acuerdo completo entre las partes.
                </li>
              </ul>
            </div>
          </section>

          {/* 15. Contacto */}
          <section>
            <h3 className="text-lg font-bold text-[#1E293B] mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB] text-white text-sm">15</span>
              Información de Contacto
            </h3>
            <div className="text-sm text-[#64748B] space-y-2">
              <p>Para preguntas sobre estos Términos y Condiciones, puede contactarnos:</p>
              <ul className="list-none space-y-1">
                <li><strong>WhatsApp:</strong> +57 320 229 2534</li>
                <li><strong>Correo:</strong> soporte@keyhomekey.com</li>
              </ul>
            </div>
          </section>

          {/* Nota final */}
          <div className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] p-4 rounded-r-lg">
            <p className="text-sm text-[#92400E]">
              <strong>Nota importante:</strong> Al registrarse y usar KeyHomeKey, usted declara haber leído, 
              entendido y aceptado estos Términos y Condiciones en su totalidad.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E2E8F0] p-6">
          <Button onClick={onClose} variant="primary" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
