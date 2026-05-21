import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { ClientesModule } from '../clientes/clientes.module';
import { EntrenadoresModule } from '../entrenadores/entrenadores.module';
import { EspaciosDeTrabajoModule } from '../espacios-de-trabajo/espacios-de-trabajo.module';
import { InvitacionesModule } from '../invitaciones/invitaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsuariosModule,
    EntrenadoresModule,
    EspaciosDeTrabajoModule,
    ClientesModule,
    InvitacionesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
