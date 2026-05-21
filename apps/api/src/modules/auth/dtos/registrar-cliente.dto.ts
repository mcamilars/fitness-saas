import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistrarClienteDto {
  @IsString()
  @MinLength(1)
  tokenInvitacion!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(8)
  contrasena!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  apellido!: string;
}
