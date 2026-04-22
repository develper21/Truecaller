import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { EnvValidationService } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: () => {
        // Validation is done in EnvValidationService
        return {};
      },
    }),
  ],
  providers: [EnvValidationService],
  exports: [EnvValidationService],
})
export class ConfigValidationModule {}
