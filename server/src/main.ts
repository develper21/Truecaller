import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvValidationService } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validate environment variables
  const envValidation = app.get(EnvValidationService);
  const validationResult = envValidation.validate();
  
  if (!validationResult.isValid) {
    console.error('Environment validation failed. Please check your .env file');
    console.error('Missing variables:', validationResult.missingVars.join(', '));
    process.exit(1);
  }
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  
  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS
  app.enableCors({
    origin: ['http://localhost:8081', 'http://localhost:3000', 'exp://'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('TrueGuard API')
    .setDescription('Next-Gen Caller ID Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Profiles', 'Profile operations')
    .addTag('Phone Numbers', 'Number lookup and info')
    .addTag('Contacts', 'Contact management')
    .addTag('Call Logs', 'Call history')
    .addTag('Spam Reports', 'Spam reporting')
    .addTag('Search', 'Number search')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 API Docs available at http://localhost:${port}/docs`);
}

bootstrap();
