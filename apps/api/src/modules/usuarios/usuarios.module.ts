import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { UsuariosRepository } from './repositories/usuarios.repository';

@Module({
  imports: [PrismaModule],
  providers: [UsuariosRepository],
  exports: [UsuariosRepository],
})
export class UsuariosModule {}
