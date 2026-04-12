import { Resend } from 'resend';

let resend: Resend | null = null;

function getClient(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set.');
    resend = new Resend(key);
  }
  return resend;
}

const FROM = 'Efi <hola@efidesk.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function buildEmailHtml({
  preheader,
  title,
  body,
  ctaUrl,
  ctaText,
  expiryNote,
}: {
  preheader: string;
  title: string;
  body: string;
  ctaUrl: string;
  ctaText: string;
  expiryNote: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Efi</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e4e4e8;border-radius:20px;padding:40px 36px;">
              <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#1a1a1e;letter-spacing:-0.4px;line-height:1.2;">
                ${title}
              </h2>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#5a5a66;">
                ${body}
              </p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:14px;background:linear-gradient(135deg,#F56040,#E1306C,#833AB4);box-shadow:0 12px 30px -10px #E1306C55;">
                    <a href="${ctaUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#8a8a96;line-height:1.6;">
                ${expiryNote}
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e8;margin:28px 0;" />
              <p style="margin:0;font-size:12px;color:#a0a0ab;line-height:1.6;">
                Si no solicitaste esto, puedes ignorar este correo. Tu cuenta está segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 8px;font-size:12px;color:#a0a0ab;">
                Efi &mdash; workspace para profesionales independientes
              </p>
              <p style="margin:0;font-size:12px;">
                <a href="https://efidesk.com" style="color:#8a8a96;text-decoration:none;">efidesk.com</a>
                &nbsp;&middot;&nbsp;
                <a href="https://efidesk.com/privacidad" style="color:#8a8a96;text-decoration:none;">Privacidad</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:hola@efidesk.com" style="color:#8a8a96;text-decoration:none;">hola@efidesk.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const firstName = name.trim().split(/\s+/)[0];
  await getClient().emails.send({
    from: FROM,
    to: email,
    subject: '¡Bienvenid@ a Efi! 👋',
    html: buildEmailHtml({
      preheader: 'Tu workspace ya está listo. Empieza a gestionar tu actividad freelance.',
      title: `Bienvenid@ a Efi, ${firstName} 👋`,
      body: 'Tu workspace ya está listo.',
      ctaUrl: APP_URL,
      ctaText: 'Ir a mi workspace',
      expiryNote: 'Cualquier duda, responde este correo — estamos aquí.',
    }),
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`;

  await getClient().emails.send({
    from: FROM,
    to: email,
    subject: 'Recupera tu contraseña – Efi',
    html: buildEmailHtml({
      preheader: 'Restablece tu contraseña de Efi',
      title: 'Recupera tu contraseña',
      body: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Este enlace expira en <strong style="color:#f1f1f3;">1 hora</strong>.',
      ctaUrl: link,
      ctaText: 'Restablecer contraseña',
      expiryNote: 'Este enlace es de un solo uso y expira en 1 hora.',
    }),
  });
}

export async function sendEmailChangeVerification(
  newEmail: string,
  token: string,
): Promise<void> {
  const link = `${APP_URL}/confirm-email?token=${token}`;

  await getClient().emails.send({
    from: FROM,
    to: newEmail,
    subject: 'Confirma tu nuevo correo – Efi',
    html: buildEmailHtml({
      preheader: 'Confirma tu nuevo correo en Efi',
      title: 'Confirma tu nuevo correo',
      body: `Haz clic para confirmar <strong style="color:#f1f1f3;">${newEmail}</strong> como tu nuevo correo en Efi. Este enlace expira en <strong style="color:#f1f1f3;">1 hora</strong>.`,
      ctaUrl: link,
      ctaText: 'Confirmar correo',
      expiryNote: 'Este enlace es de un solo uso y expira en 1 hora.',
    }),
  });
}
