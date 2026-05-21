import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { ClientesModule } from '../clientes/clientes.module';
import { EntrenadoresModule } from '../entrenadores/entrenadores.module';
import { EspaciosDeTrabajoModule } from '../espacios-de-trabajo/espacios-de-trabajo.module';
import { InvitacionesModule } from '../invitaciones/invitaciones.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    UsuariosModule,
    EntrenadoresModule,
    EspaciosDeTrabajoModule,
    ClientesModule,
    InvitacionesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, WorkspaceGuard, RolesGuard],
  exports: [
    AuthService,
    JwtAuthGuard,
    WorkspaceGuard,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
