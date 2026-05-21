import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { ClientesRepository } from './repositories/clientes.repository';

@Module({
  imports: [PrismaModule],
  providers: [ClientesRepository],
  exports: [ClientesRepository],
})
export class ClientesModule {}
