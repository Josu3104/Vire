import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class EmailsService {
  private brevoClient: BrevoClient | null = null;
  private readonly logger = new Logger(EmailsService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.brevoApiKey');
    
    if (apiKey) {
      this.brevoClient = new BrevoClient({ apiKey });
    } else {
      this.logger.warn('Brevo API key not set. Email service will run in mock mode.');
    }
  }

  async sendWelcomeEmail(toEmail: string, name: string) {
    if (!this.brevoClient) {
      this.logger.log(`[MOCK EMAIL] Sending welcome email to ${toEmail}`);
      return;
    }

    try {
      await this.brevoClient.transactionalEmails.sendTransacEmail({
        subject: "Bienvenido a Vire",
        htmlContent: `<html><body><h1>Hola ${name}</h1><p>Bienvenido a la red IEEE CIMEQH Vire.</p></body></html>`,
        sender: { name: "IEEE Vire", email: "no-reply@vire.com" },
        to: [{ email: toEmail, name }]
      });
      this.logger.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
    }
  }
}
