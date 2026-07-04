import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  async send(options: EmailOptions) {
    if (config.nodeEnv === 'development') {
      console.log(`[DEV EMAIL] To: ${options.to}, Subject: ${options.subject}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"VANZHUB" <${config.smtp.from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${config.corsOrigins[0]}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your VANZHUB account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">VANZHUB</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b; margin-top: 0;">Verify your email</h2>
            <p style="color: #64748b; line-height: 1.6;">Click the button below to verify your email address and activate your VANZHUB account.</p>
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not create an account, please ignore this email.</p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${config.corsOrigins[0]}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your VANZHUB password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">VANZHUB</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b; margin-top: 0;">Reset your password</h2>
            <p style="color: #64748b; line-height: 1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, please ignore this email.</p>
          </div>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
