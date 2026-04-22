import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
}

@Injectable()
export class EnvValidationService {
  private readonly logger = new Logger(EnvValidationService.name);

  // Required environment variables
  private readonly requiredVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  // Optional but recommended variables
  private readonly recommendedVars = [
    'REDIS_URL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  // Variables that should not use default values in production
  private readonly productionSensitiveVars = [
    'JWT_SECRET',
    'DB_PASSWORD',
  ];

  constructor(private configService: ConfigService) {}

  validate(): EnvValidationResult {
    const missingVars: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Check required variables
    for (const varName of this.requiredVars) {
      const value = this.configService.get(varName);
      if (!value) {
        missingVars.push(varName);
        isValid = false;
      }
    }

    // Check recommended variables
    for (const varName of this.recommendedVars) {
      const value = this.configService.get(varName);
      if (!value) {
        warnings.push(`Optional variable ${varName} is not set. Some features may be disabled.`);
      }
    }

    // Check production environment
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      // Check for default/placeholder values in production
      const jwtSecret = this.configService.get('JWT_SECRET');
      if (jwtSecret && jwtSecret.includes('default') || jwtSecret?.length < 32) {
        warnings.push('JWT_SECRET should be a strong, unique value in production (min 32 chars)');
      }

      // Warn about missing Firebase in production
      const firebaseProjectId = this.configService.get('FIREBASE_PROJECT_ID');
      if (!firebaseProjectId) {
        warnings.push('Firebase not configured. Push notifications will not work in production.');
      }
    }

    // Log results
    if (!isValid) {
      this.logger.error('❌ Environment validation failed!');
      this.logger.error(`Missing required variables: ${missingVars.join(', ')}`);
    } else {
      this.logger.log('✅ Environment validation passed');
    }

    if (warnings.length > 0) {
      this.logger.warn('⚠️  Environment warnings:');
      warnings.forEach(w => this.logger.warn(`  - ${w}`));
    }

    return { isValid, missingVars, warnings };
  }

  // Get database URL
  getDatabaseUrl(): string {
    const dbUrl = this.configService.get('DATABASE_URL');
    if (dbUrl) return dbUrl;

    const host = this.configService.get('DB_HOST');
    const port = this.configService.get('DB_PORT');
    const user = this.configService.get('DB_USER');
    const password = this.configService.get('DB_PASSWORD');
    const dbName = this.configService.get('DB_NAME');

    return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  }

  // Get Redis URL
  getRedisUrl(): string {
    return this.configService.get('REDIS_URL', 'redis://localhost:6379');
  }

  // Check if Firebase is configured
  isFirebaseConfigured(): boolean {
    return !!(
      this.configService.get('FIREBASE_PROJECT_ID') &&
      this.configService.get('FIREBASE_PRIVATE_KEY') &&
      this.configService.get('FIREBASE_CLIENT_EMAIL')
    );
  }

  // Check if Twilio is configured
  isTwilioConfigured(): boolean {
    return !!(
      this.configService.get('TWILIO_ACCOUNT_SID') &&
      this.configService.get('TWILIO_AUTH_TOKEN') &&
      this.configService.get('TWILIO_PHONE_NUMBER')
    );
  }
}
