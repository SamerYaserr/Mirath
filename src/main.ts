import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { winstonLogger } from './config/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      enableDebugMessages: true,
      whitelist: true,
      forbidNonWhitelisted: true,

      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
        }));

        winstonLogger.error('Validation failed:', JSON.stringify(messages));
        return new BadRequestException(
          errors.map((e) => Object.values(e.constraints || {}).join(', ')),
        );
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Mirath Project API')
    .setDescription('The official API reference')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/reference',
    apiReference({
      content: document,
      theme: 'purple',
      layout: 'modern',
      darkMode: true,
      showSidebar: true,
      hideModels: true,
      searchHotKey: 'k',
      authentication: {
        preferredSecurityScheme: 'bearerAuth',
      },
      servers: [{ url: 'http://127.0.0.1:3000', description: 'Local' }],
      metaData: {
        title: 'Mirath API Reference',
      },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
