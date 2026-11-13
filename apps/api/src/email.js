import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter = null;

function getTransporter() {
  if (!transporter && config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

export async function sendResetEmail(email, token) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[email] SMTP no configurado. Usando modo desarrollo.');
    console.log(`[email] Link de reset: http://localhost:5175/reset-password?token=${token}`);
    return;
  }

  const resetUrl = `${config.corsOrigin}/reset-password?token=${token}`;

  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: 'Recuperación de contraseña - Sistema IA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
        <p style="color: #666; font-size: 12px;">Sistema IA - Sistema de Administración</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[email] Email de reset enviado a ${email}`);
}
