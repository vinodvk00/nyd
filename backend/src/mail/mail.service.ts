import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
    this.fromEmail = 'NYD <noreply@nyd.life>';
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your NYD password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f5f5f5;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h1 style="margin: 0 0 24px; font-size: 24px; color: #111;">Reset your password</h1>
              <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
                We received a request to reset your NYD password. Click the button below to set a new password.
              </p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Reset Password
              </a>
              <p style="margin: 24px 0 0; color: #888; font-size: 14px; line-height: 1.6;">
                This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      return false;
    }
  }

  async sendMagicLink(email: string, token: string, isNewUser: boolean): Promise<boolean> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/auth/verify?token=${token}`;

    const subject = isNewUser ? 'Welcome to NYD - Verify your email' : 'Sign in to NYD';
    const heading = isNewUser ? 'Welcome to NYD!' : 'Sign in to NYD';
    const message = isNewUser
      ? 'Click the button below to verify your email and complete your registration.'
      : 'Click the button below to sign in to your account.';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f5f5f5;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h1 style="margin: 0 0 24px; font-size: 24px; color: #111;">${heading}</h1>
              <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
                ${message}
              </p>
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
                ${isNewUser ? 'Verify Email' : 'Sign In'}
              </a>
              <p style="margin: 24px 0 0; color: #888; font-size: 14px; line-height: 1.6;">
                This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`Magic link email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send magic link email: ${error.message}`);
      return false;
    }
  }
}
