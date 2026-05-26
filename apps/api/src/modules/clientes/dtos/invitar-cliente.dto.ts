import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InvitarClienteDto {
  @ApiProperty({ example: 'cliente@email.com', description: 'Correo al que se enviará el enlace de invitación' })
  @IsEmail()
  correo!: string;
}
