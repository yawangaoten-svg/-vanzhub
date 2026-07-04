import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
}

export function createEmailService(env: { SMTP_HOST: string; SMTP_PORT: string; SMTP_USER: string; SMTP_PASS: string; SMTP_FROM: string }) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: parseInt(env.SMTP_PORT || '587') === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return {
    async send(options: EmailOptions) {
      try {
        await transporter.sendMail({
          from: `"VANZHUB" <${env.SMTP_FROM}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    },

    async sendVerificationEmail(email: string, token: string, origin: string) {
      const url = `${origin}/verify-email?token=${token}`;
      await this.send({
        to: email,
        subject: 'Verify your VANZHUB account',
        html: `<div style="font-family:Arial;max-width:480px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">VANZHUB</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#1e293b;margin-top:0;">Verify your email</h2>
            <p style="color:#64748b;">Click the button below to verify your email and activate your account.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Verify Email</a>
            <p style="color:#94a3b8;font-size:12px;">If you did not create an account, ignore this email.</p>
          </div>
        </div>`,
      });
    },

    async sendPasswordResetEmail(email: string, token: string, origin: string) {
      const url = `${origin}/reset-password?token=${token}`;
      await this.send({
        to: email,
        subject: 'Reset your VANZHUB password',
        html: `<div style="font-family:Arial;max-width:480px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">VANZHUB</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="color:#1e293b;margin-top:0;">Reset your password</h2>
            <p style="color:#64748b;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset Password</a>
            <p style="color:#94a3b8;font-size:12px;">If you did not request a password reset, ignore this email.</p>
          </div>
        </div>`,
      });
    },
  };
}
