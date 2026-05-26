import { IsEmail } from 'class-validator';

export class InvitarClienteDto {
  @IsEmail()
  correo!: string;
}
