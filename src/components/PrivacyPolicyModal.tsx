'use client';

import React from 'react';
import { Shield, FileText, X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
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
              Políticas de Tratamiento de Datos Personales
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5 text-sm leading-relaxed">
            {/* Introducción */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#1E293B]">1. Introducción</h3>
              </div>
              <p className="text-[#64748B]">
                KeyHomeKey, en adelante &ldquo;la Plataforma&rdquo;, es responsable del tratamiento de los datos personales
                que usted nos proporciona. Nos comprometemos a proteger su privacidad y a cumplir con la Ley 1581
                de 2012 de Colombia sobre Protección de Datos Personales y las demás normas aplicables, incluyendo
                los principios del Reglamento General de Protección de Datos (GDPR).
              </p>
            </section>

            {/* Finalidad */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">2. Finalidad del Tratamiento de Datos</h3>
              <p className="text-[#64748B] mb-2">
                Los datos personales que recopilamos se utilizan para las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
                <li>Gestión y administración de inmuebles (propiedades en alquiler o venta)</li>
                <li>Facilitación de comunicación entre propietarios, inquilinos y proveedores de servicios</li>
                <li>Procesamiento y seguimiento de contratos de arrendamiento</li>
                <li>Gestión de solicitudes de mantenimiento y reparaciones</li>
                <li>Provisión de soporte técnico y atención al cliente</li>
                <li>Envío de notificaciones relacionadas con el servicio</li>
                <li>Mejora continua de nuestros servicios y experiencia de usuario</li>
                <li>Cumplimiento de obligaciones legales y regulatorias</li>
              </ul>
            </section>

            {/* Datos Recopilados */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">3. Datos Personales Recopilados</h3>
              <p className="text-[#64748B] mb-2">
                Para proporcionar nuestros servicios, podemos recopilar los siguientes tipos de información:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
                <li>Datos de identificación: Nombre completo, número de identificación</li>
                <li>Datos de contacto: Correo electrónico, número de teléfono, dirección física</li>
                <li>Información de propiedades: Ubicación, características, fotografías</li>
                <li>Datos financieros: Información relacionada con pagos y transacciones (cuando aplique)</li>
                <li>Información de uso: Datos sobre cómo utiliza la plataforma</li>
                <li>Comunicaciones: Mensajes, tickets de soporte y comentarios</li>
              </ul>
            </section>

            {/* Derechos del Titular */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">4. Derechos del Titular (Derechos ARCO)</h3>
              <p className="text-[#64748B] mb-2">
                Como titular de sus datos personales, usted tiene los siguientes derechos:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
                <li><strong>Acceso:</strong> Conocer, actualizar y rectificar sus datos personales</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos</li>
                <li><strong>Cancelación:</strong> Solicitar la supresión de sus datos cuando corresponda</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos en determinadas circunstancias</li>
                <li>Revocar la autorización otorgada para el tratamiento de datos</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)</li>
              </ul>
              <p className="text-[#64748B] mt-2">
                Para ejercer estos derechos, puede contactarnos a través del correo electrónico indicado en la
                sección de contacto.
              </p>
            </section>

            {/* Medidas de Seguridad */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">5. Medidas de Seguridad</h3>
              <p className="text-[#64748B]">
                Implementamos medidas técnicas, administrativas y físicas apropiadas para proteger sus datos
                personales contra acceso no autorizado, pérdida, destrucción o alteración. Utilizamos protocolos
                de seguridad estándar de la industria, incluyendo cifrado SSL/TLS para la transmisión de datos,
                almacenamiento seguro y controles de acceso restringido.
              </p>
            </section>

            {/* Transferencia de Datos */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">6. Transferencia y Divulgación de Datos</h3>
              <p className="text-[#64748B] mb-2">
                Sus datos personales pueden ser compartidos con:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[#64748B] ml-2">
                <li>Proveedores de servicios tecnológicos necesarios para el funcionamiento de la plataforma</li>
                <li>Proveedores de mantenimiento y reparaciones cuando sea necesario para gestionar solicitudes</li>
                <li>Autoridades gubernamentales cuando sea requerido por ley</li>
              </ul>
              <p className="text-[#64748B] mt-2">
                Todos los terceros con quienes compartimos información están obligados a mantener la
                confidencialidad y seguridad de sus datos personales.
              </p>
            </section>

            {/* Retención de Datos */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">7. Retención de Datos</h3>
              <p className="text-[#64748B]">
                Conservaremos sus datos personales durante el tiempo necesario para cumplir con las finalidades
                descritas en esta política o según lo requiera la ley. Una vez que ya no sean necesarios,
                procederemos a su eliminación o anonimización de manera segura.
              </p>
            </section>

            {/* Contacto */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">8. Información de Contacto</h3>
              <p className="text-[#64748B]">
                Para ejercer sus derechos, realizar consultas o presentar reclamos relacionados con el
                tratamiento de sus datos personales, puede contactarnos a través de:
              </p>
              <p className="text-[#64748B] mt-2">
                <strong>Correo electrónico:</strong>{' '}
                <a href="mailto:privacidad@keyhomekey.com" className="text-[#2563EB] hover:underline">
                  privacidad@keyhomekey.com
                </a>
              </p>
            </section>

            {/* Aceptación */}
            <section>
              <h3 className="text-base font-bold text-[#1E293B] mb-2">9. Aceptación de la Política</h3>
              <p className="text-[#64748B]">
                Al hacer clic en &ldquo;Aceptar Políticas&rdquo;, usted reconoce que ha leído, comprendido y acepta estas
                Políticas de Tratamiento de Datos Personales. El uso continuado de nuestros servicios constituye
                su aceptación de cualquier actualización a esta política. Nos reservamos el derecho de modificar
                estas políticas, notificándole oportunamente de cualquier cambio significativo.
              </p>
            </section>

            {/* Fecha */}
            <section className="pt-4 border-t border-[#E2E8F0]">
              <p className="text-xs text-[#94A3B8] text-center">
                Última actualización: Febrero 2026
              </p>
            </section>
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="border-t border-[#E2E8F0] p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
