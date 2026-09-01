import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  // Logger ko constructor se bahar class property banao
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async sendResetLink(to: string, resetToken: string) {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const resetUrl = `${backendUrl}/api/v1/auth/reset-pass?token=${resetToken}`;

    this.logger.log('==============================================');
    this.logger.log(`[MOCK EMAIL] To: ${to}`);
    this.logger.log(`[MOCK EMAIL] Reset Link: ${resetUrl}`);
    this.logger.log('==============================================');

    return { success: true };
  }

  async sendDeviceSwitchMail(to: string, token: string) {
  const switchUrl = `http://localhost:3000/api/v1/auth/device-switch/verify?token=${token}`;

  this.logger.log('==============================================');
  this.logger.log(`[MOCK EMAIL] Device Switch Requested for: ${to}`);
  this.logger.log(`[MOCK EMAIL] Verification Link: ${switchUrl}`);
  this.logger.log('==============================================');

  return { success: true };
}
}