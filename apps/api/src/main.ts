import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { EjerciciosRepository } from './modules/ejercicios/repositories/ejercicios.repository';
import { EjerciciosCatalog } from './modules/registry/ejercicios.catalog';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: configService.get<string>('APP_URL'),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fitness SaaS API')
    .setDescription(
      'API REST para la plataforma fitness. Todas las respuestas exitosas se envuelven en `{ data: ... }`. ' +
        'Los errores siguen el formato `{ statusCode, mensaje, error }`. ' +
        'Los endpoints protegidos requieren el header `Authorization: Bearer <token>`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const ejerciciosRepository = app.get(EjerciciosRepository);
  await EjerciciosCatalog.getInstance().cargarDesde(ejerciciosRepository);

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
