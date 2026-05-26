import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistrarClienteDto {
  @ApiProperty({ example: 'abc123token', description: 'Token recibido por correo en la invitación' })
  @IsString()
  @MinLength(1)
  tokenInvitacion!: string;

  @ApiProperty({ example: 'cliente@email.com' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: 'clave5678', minLength: 8 })
  @IsString()
  @MinLength(8)
  contrasena!: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  @MinLength(1)
  apellido!: string;
}
