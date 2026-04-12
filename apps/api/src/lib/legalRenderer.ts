/**
 * Server-rendered legal pages (privacy, terms).
 * Google's crawler needs real HTML at /privacidad and /terminos
 * for OAuth consent screen verification.
 */

const BRAND_ORANGE = '#F56040';
const BRAND_PINK = '#E1306C';
const BRAND_PURPLE = '#833AB4';

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Efi</title>
  <meta name="description" content="${title} de Efi, CRM personal para freelancers." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f4f6; color: #1a1a1e; line-height: 1.65;
      padding: 40px 16px;
    }
    .wrap { max-width: 640px; margin: 0 auto; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo span { font-size: 22px; font-weight: 400; color: #1a1a1e; letter-spacing: -0.3px; }
    .card {
      background: #fff; border: 1px solid #e4e4e8; border-radius: 20px;
      padding: 40px 36px;
    }
    h1 { font-size: 22px; font-weight: 800; color: #1a1a1e; letter-spacing: -0.4px; margin-bottom: 8px; }
    .date { font-size: 12px; color: #8a8a96; margin-bottom: 24px; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1a1a1e; margin: 24px 0 8px; }
    p, li { font-size: 15px; color: #5a5a66; line-height: 1.65; }
    ul { padding-left: 20px; margin-top: 6px; }
    li { margin-bottom: 4px; }
    .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #a0a0ab; }
    .footer a { color: #8a8a96; text-decoration: none; }
    .back {
      display: inline-block; margin-bottom: 20px; font-size: 13px; font-weight: 700;
      color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 14px;
      background: linear-gradient(135deg, ${BRAND_ORANGE}, ${BRAND_PINK}, ${BRAND_PURPLE});
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">
      <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FCAF45"/>
            <stop offset="30%" stop-color="#F56040"/>
            <stop offset="60%" stop-color="#E1306C"/>
            <stop offset="100%" stop-color="#833AB4"/>
          </linearGradient>
        </defs>
        <rect x="26" y="18" width="12" height="28" rx="6" fill="url(#g)" opacity="0.65"/>
        <path d="M10,24 C10,15 18,9 32,9 C46,9 54,15 54,24 C54,27 48,28 40,26 C36,25 34,22 32,22 C30,22 28,25 24,26 C16,28 10,27 10,24Z" fill="url(#g)"/>
      </svg>
      <span>Efi</span>
    </div>
    <a class="back" href="/">← Volver a Efi</a>
    <div class="card">
      ${body}
    </div>
    <div class="footer">
      <p>Efi &mdash; workspace para profesionales independientes</p>
      <p style="margin-top:6px;">
        <a href="/">efidesk.com</a> &middot;
        <a href="/privacidad">Privacidad</a> &middot;
        <a href="/terminos">Términos</a> &middot;
        <a href="mailto:hola@efidesk.com">hola@efidesk.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function renderPrivacyPage(): string {
  return layout('Política de Privacidad', `
      <h1>Política de Privacidad</h1>
      <p class="date">Última actualización: abril de 2026</p>

      <h2>Información que recopilamos</h2>
      <p>
        Recopilamos únicamente la información necesaria para brindarte el servicio: nombre,
        dirección de correo electrónico y preferencias de cuenta que introduces directamente en
        la plataforma. No vendemos ni compartimos tus datos personales con terceros no autorizados.
      </p>

      <h2>Cómo usamos tu información</h2>
      <p>Usamos tus datos exclusivamente para:</p>
      <ul>
        <li>Identificarte y gestionar tu sesión de forma segura.</li>
        <li>Almacenar tus contactos (partners), tareas y configuración de CRM.</li>
        <li>Enviarte comunicaciones relacionadas con el servicio cuando sea necesario.</li>
      </ul>

      <h2>Autenticación con Google (OAuth)</h2>
      <p>
        Si inicias sesión con Google, recibimos tu nombre, dirección de correo electrónico y
        foto de perfil públicos según los permisos que concedes. No accedemos a tu historial de
        correo, contactos de Google ni ningún otro dato fuera del alcance autorizado. Puedes
        revocar el acceso en cualquier momento desde tu cuenta de Google.
      </p>

      <h2>Almacenamiento y seguridad</h2>
      <p>
        Tus datos se almacenan en servidores seguros proporcionados por Supabase (PostgreSQL).
        Cada cuenta tiene aislamiento estricto: ningún usuario puede acceder a los datos de otro.
        Las contraseñas se almacenan cifradas con bcrypt y nunca en texto plano.
      </p>

      <h2>Cookies y sesiones</h2>
      <p>
        Utilizamos cookies de sesión imprescindibles para mantenerte autenticado. No usamos
        cookies de seguimiento publicitario ni de terceros. Consulta nuestra
        <a href="/terminos">Política de Cookies</a> para más detalle.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Tienes derecho a acceder, rectificar y eliminar tus datos personales en cualquier
        momento. Para ejercer estos derechos, escríbenos a
        <strong>soporte@efidesk.com</strong>.
      </p>
  `);
}

export function renderTermsPage(): string {
  return layout('Términos y Condiciones', `
      <h1>Términos y Condiciones</h1>
      <p class="date">Última actualización: abril de 2026</p>

      <h2>Aceptación de los términos</h2>
      <p>
        Al crear una cuenta y usar Efi, aceptas estos Términos y Condiciones. Si no estás de
        acuerdo, no debes usar el servicio.
      </p>

      <h2>Descripción del servicio</h2>
      <p>
        Efi es una plataforma de CRM personal diseñada para freelancers. Permite gestionar
        relaciones con clientes y colaboradores, hacer seguimiento de proyectos y organizar
        tareas. Es un espacio personal — no existe colaboración entre cuentas.
      </p>

      <h2>Uso aceptable</h2>
      <p>Te comprometes a no:</p>
      <ul>
        <li>Usar el servicio para actividades ilegales o fraudulentas.</li>
        <li>Intentar acceder a cuentas o datos de otros usuarios.</li>
        <li>Introducir código malicioso o intentar comprometer la seguridad de la plataforma.</li>
        <li>Revender o redistribuir el servicio sin autorización expresa.</li>
      </ul>

      <h2>Cuenta de usuario</h2>
      <p>
        Eres responsable de mantener la confidencialidad de tus credenciales y de todas las
        actividades que ocurran bajo tu cuenta. Notifícanos de inmediato ante cualquier uso no
        autorizado.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        El software, diseño y marca de Efi son propiedad de sus creadores y están protegidos por
        las leyes de propiedad intelectual. Tus datos y contenidos siguen siendo tuyos.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        Efi se proporciona «tal cual», sin garantías de disponibilidad continua. No somos
        responsables de pérdidas de datos derivadas de fallos técnicos imprevisibles. Recomendamos
        exportar tus datos periódicamente.
      </p>

      <h2>Modificaciones y terminación</h2>
      <p>
        Podemos modificar estos términos con previo aviso. El uso continuado del servicio tras
        los cambios implica su aceptación. Puedes cancelar tu cuenta en cualquier momento desde
        Configuración.
      </p>
  `);
}
