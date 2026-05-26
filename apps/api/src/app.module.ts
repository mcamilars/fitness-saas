import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@repo/database';
import { AppController } from './app.controller';
import { CommandsModule } from './commands/commands.module';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { AsignacionesModule } from './modules/asignaciones/asignaciones.module';
import { AuthModule } from './modules/auth/auth.module';
import { EjerciciosModule } from './modules/ejercicios/ejercicios.module';
import { HealthController } from './modules/health/health.controller';
import { MailerModule } from './modules/mailer/mailer.module';
import { PlanesEntrenamientoModule } from './modules/planes-entrenamiento/planes-entrenamiento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    EjerciciosModule,
    MailerModule,
    PlanesEntrenamientoModule,
    AsignacionesModule,
    CommandsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
