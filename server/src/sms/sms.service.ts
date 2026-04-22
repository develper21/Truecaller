import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SMSMessage {
  to: string;
  message: string;
  templateId?: string;
}

export interface OTPConfig {
  length?: number;
  expiryMinutes?: number;
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private provider: 'twilio' | 'msg91' | 'aws-sns' | 'mock' = 'mock';
  private twilioClient: any;
  private msg91AuthKey: string | null = null;

  constructor(private configService: ConfigService) {
    this.initializeProvider();
  }

  private async initializeProvider() {
    // Check for Twilio
    const twilioSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    if (twilioSid && twilioToken) {
      this.provider = 'twilio';
      try {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(twilioSid, twilioToken);
        this.logger.log('Twilio SMS provider initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Twilio:', error.message);
        this.provider = 'mock';
      }
      return;
    }

    // Check for MSG91 (Indian provider)
    const msg91Key = this.configService.get('MSG91_AUTH_KEY');
    if (msg91Key) {
      this.provider = 'msg91';
      this.msg91AuthKey = msg91Key;
      this.logger.log('MSG91 SMS provider initialized');
      return;
    }

    // Check for AWS SNS
    const awsAccessKey = this.configService.get('AWS_ACCESS_KEY_ID');
    if (awsAccessKey) {
      this.provider = 'aws-sns';
      this.logger.log('AWS SNS SMS provider initialized');
      return;
    }

    this.logger.warn('No SMS provider configured - using mock mode');
    this.provider = 'mock';
  }

  generateOTP(config: OTPConfig = {}): string {
    const length = config.length || 6;
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }

  async sendSMS(message: SMSMessage): Promise<void> {
    // Normalize phone number
    const to = this.normalizePhoneNumber(message.to);

    switch (this.provider) {
      case 'twilio':
        await this.sendViaTwilio(to, message.message);
        break;
      case 'msg91':
        await this.sendViaMSG91(to, message.message, message.templateId);
        break;
      case 'aws-sns':
        await this.sendViaSNS(to, message.message);
        break;
      case 'mock':
      default:
        this.sendViaMock(to, message.message);
        break;
    }
  }

  async sendOTP(phoneNumber: string, otp: string, template?: string): Promise<void> {
    const message = template 
      ? template.replace('{{OTP}}', otp)
      : `Your TrueGuard verification code is: ${otp}. Valid for 10 minutes.`;

    await this.sendSMS({
      to: phoneNumber,
      message,
      templateId: 'otp_template', // Provider-specific template ID
    });

    this.logger.debug(`OTP sent to ${phoneNumber}`);
  }

  private async sendViaTwilio(to: string, message: string): Promise<void> {
    try {
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
      await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to,
      });
      this.logger.log(`SMS sent via Twilio to ${to}`);
    } catch (error) {
      this.logger.error('Twilio send failed:', error.message);
      throw error;
    }
  }

  private async sendViaMSG91(to: string, message: string, templateId?: string): Promise<void> {
    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': this.msg91AuthKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          sender: this.configService.get('MSG91_SENDER_ID', 'TRUECL'),
          short_url: '0',
          mobiles: to.replace('+', ''), // MSG91 expects numbers without +
          vars: {
            message,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MSG91 API error: ${response.statusText}`);
      }

      this.logger.log(`SMS sent via MSG91 to ${to}`);
    } catch (error) {
      this.logger.error('MSG91 send failed:', error.message);
      throw error;
    }
  }

  private async sendViaSNS(to: string, message: string): Promise<void> {
    // AWS SNS is currently disabled
    // Uncomment below to enable AWS SNS for SMS
    /*
    try {
      // AWS SDK dynamic import
      const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
      
      const client = new SNSClient({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID')!,
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')!,
        },
      });

      await client.send(new PublishCommand({
        PhoneNumber: to,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: this.configService.get('AWS_SNS_SENDER_ID', 'TrueGuard'),
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      }));

      this.logger.log(`SMS sent via AWS SNS to ${to}`);
    } catch (error) {
      this.logger.error('AWS SNS send failed:', error.message);
      throw error;
    }
    */
    this.logger.warn(`AWS SNS is disabled. SMS to ${to} not sent.`);
    throw new Error('AWS SNS is currently disabled');
  }

  private sendViaMock(to: string, message: string): void {
    this.logger.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
    // In development, just log the message
    console.log('========================================');
    console.log('📱 MOCK SMS');
    console.log('To:', to);
    console.log('Message:', message);
    console.log('========================================');
  }

  private normalizePhoneNumber(phone: string): string {
    // Ensure + prefix for international format
    if (!phone.startsWith('+')) {
      // Assume Indian number if no country code
      if (phone.length === 10) {
        return `+91${phone}`;
      }
      return `+${phone}`;
    }
    return phone;
  }

  getProvider(): string {
    return this.provider;
  }

  isConfigured(): boolean {
    return this.provider !== 'mock';
  }
}
