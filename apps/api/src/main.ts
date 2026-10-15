import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './adapters/http/domain-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: () =>
        new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'The request body is invalid.',
          },
        }),
    }),
  );
  app.useGlobalFilters(new DomainErrorFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ISS Sport API')
    .setDescription('ISS Sport master data API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
